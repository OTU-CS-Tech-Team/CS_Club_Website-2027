"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import QrScanner from "qr-scanner";

QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";

type EventOption = {
  id: string;
  title: string;
};

type Rsvp = {
  eventId: string;
  email: string;
  name: string;
  yearOfStudy: string | null;
  attended: boolean;
};

type Preview = {
  name: string;
  event: string;
  points: number;
};

type Phase = "scanning" | "confirm" | "done";

export default function CheckinScanner({
  events,
}: {
  events: EventOption[];
}) {
  const router = useRouter();
  const [eventId, setEventId] = useState("");
  const [phase, setPhase] = useState<Phase>("scanning");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [feedback, setFeedback] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [email, setEmail] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState<Set<string>>(new Set());
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [rsvpsLoading, setRsvpsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const eventIdRef = useRef(eventId);
  const pendingTokenRef = useRef<string | null>(null);

  const stableTokenRef = useRef<string | null>(null);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const LOCK_TIME = 500;

  useEffect(() => {
    eventIdRef.current = eventId;
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      setRsvps([]);
      return;
    }

    let cancelled = false;
    setRsvpsLoading(true);

    fetch(`/api/admin/checkin-rsvps?eventId=${encodeURIComponent(eventId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.rsvps) {
          setRsvps(data.rsvps);
        }
      })
      .catch((err) => {
        console.error('Failed to load RSVPs:', err);
      })
      .finally(() => {
        if (!cancelled) setRsvpsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  function checkedInMessage(data: { name?: string; event?: string; points?: number | null }) {
    const points = typeof data.points === "number" ? ` (+${data.points} pts)` : "";
    return `✅ ${data.name} checked in to ${data.event}${points}`;
  }

  async function postAttendance(body: Record<string, unknown>) {
    const response = await fetch("/api/admin/attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...body,
        eventId: eventIdRef.current,
      }),
    });

    const data = await response.json().catch(() => ({}));

    return {
      ok: response.ok,
      data,
    };
  }

  async function captureQRCode(token: string) {
    if (pendingTokenRef.current) return;

    pendingTokenRef.current = token;

    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");

      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    }

    scannerRef.current?.pause();

    setPreview(null);
    setFeedback("");
    setPhase("confirm");

    try {
      const { ok, data } = await postAttendance({
        token,
        preview: true,
      });

      if (ok) {
        setPreview(data as Preview);
      } else {
        setFeedback(`⚠️ ${data.error ?? "Could not read that code"}`);
      }
    } catch {
      setFeedback("⚠️ Network error — tap Rescan to try again");
    }
  }

  function handleScan(token: string) {
    if (pendingTokenRef.current || !eventIdRef.current) {
      return;
    }

    if (stableTokenRef.current !== token) {
      stableTokenRef.current = token;

      if (lockTimerRef.current) {
        clearTimeout(lockTimerRef.current);
      }

      lockTimerRef.current = setTimeout(() => {
        if (stableTokenRef.current === token && !pendingTokenRef.current) {
          captureQRCode(token);
        }
      }, LOCK_TIME);

      return;
    }
  }

  useEffect(() => {
    if (!videoRef.current || !eventId) {
      return;
    }

    const video = videoRef.current;

    const scanner = new QrScanner(
      video,
      (result) => {
        handleScan(result.data);
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
      },
    );

    scannerRef.current = scanner;

    scanner
      .start()
      .then(() => {
        console.log("QR camera started");
        console.log("Video dimensions:", video.videoWidth, video.videoHeight);
      })
      .catch((error) => {
        console.error("Camera error:", error);

        setFeedback(`⚠️ Camera error: ${error?.message ?? String(error)}`);
      });

    return () => {
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;

      if (lockTimerRef.current) {
        clearTimeout(lockTimerRef.current);
        lockTimerRef.current = null;
      }

      stableTokenRef.current = null;
    };
  }, [eventId]);

  function resumeScanning() {
    pendingTokenRef.current = null;
    stableTokenRef.current = null;

    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }

    setPreview(null);
    setFeedback("");
    setPhase("scanning");

    scannerRef.current?.start().catch((error) => {
      setFeedback(`⚠️ Camera error: ${error?.message ?? String(error)}`);
    });
  }

  async function handleConfirmScan() {
    const token = pendingTokenRef.current;

    if (!token || confirming) {
      return;
    }

    setConfirming(true);

    try {
      const { ok, data } = await postAttendance({
        token,
      });

      setFeedback(ok ? checkedInMessage(data) : `⚠️ ${data.error ?? "Check-in failed"}`);

      if (ok) {
        router.refresh();
        fetch(`/api/admin/checkin-rsvps?eventId=${encodeURIComponent(eventIdRef.current)}`)
          .then((res) => res.json())
          .then((refreshData) => {
            if (refreshData.rsvps) setRsvps(refreshData.rsvps);
          })
          .catch(() => {});
      }
      setPhase("done");
    } catch {
      setFeedback("⚠️ Network error — not saved, tap Confirm again");
    } finally {
      setConfirming(false);
    }
  }

  async function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!eventId || !email) {
      return;
    }

    setManualLoading(true);

    try {
      const { ok, data } = await postAttendance({
        email,
      });

      setFeedback(ok ? checkedInMessage(data) : `⚠️ ${data.error ?? "Check-in failed"}`);

      if (ok) {
        setEmail("");
        setJustCheckedIn((prev) => new Set(prev).add(`${eventId}:${email.trim().toLowerCase()}`));
        router.refresh();
        fetch(`/api/admin/checkin-rsvps?eventId=${encodeURIComponent(eventId)}`)
          .then((res) => res.json())
          .then((refreshData) => {
            if (refreshData.rsvps) setRsvps(refreshData.rsvps);
          })
          .catch(() => {});
      }
    } catch {
      setFeedback("⚠️ Network error — try again");
    } finally {
      setManualLoading(false);
    }
  }

  async function handleRsvpCheckIn(rsvp: Rsvp) {
    try {
      const { ok, data } = await postAttendance({
        email: rsvp.email,
      });

      setFeedback(ok ? checkedInMessage(data) : `⚠️ ${data.error ?? "Check-in failed"}`);

      if (ok) {
        setJustCheckedIn((prev) => new Set(prev).add(`${eventId}:${rsvp.email.trim().toLowerCase()}`));
        router.refresh();
        fetch(`/api/admin/checkin-rsvps?eventId=${encodeURIComponent(eventId)}`)
          .then((res) => res.json())
          .then((refreshData) => {
            if (refreshData.rsvps) setRsvps(refreshData.rsvps);
          })
          .catch(() => {});
      }
    } catch {
      setFeedback("⚠️ Network error — try again");
    }
  }

  if (events.length === 0) {
    return <p>No events yet — create one above first.</p>;
  }

  const currentRsvps = rsvps.filter((rsvp) => rsvp.eventId === eventId);

  return (
    <div>
      <label>
        Event
        <select
          value={eventId}
          onChange={(event) => {
            setEventId(event.target.value);

            pendingTokenRef.current = null;
            stableTokenRef.current = null;

            if (lockTimerRef.current) {
              clearTimeout(lockTimerRef.current);
              lockTimerRef.current = null;
            }

            setPreview(null);
            setFeedback("");
            setPhase("scanning");
            setJustCheckedIn(new Set());
          }}
        >
          <option value="">— pick today&apos;s event —</option>

          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
      </label>

      {!eventId ? (
        <p className="scan-feedback">
          ⚠️ Choose an event above — scanning is off until you do.
        </p>
      ) : (
        <>
          <video
            ref={videoRef}
            className="scanner-video"
            muted
            playsInline
            autoPlay
            hidden={phase !== "scanning"}
          />

          <canvas
            ref={canvasRef}
            className="scanner-video"
            hidden={phase === "scanning"}
          />

          {phase === "confirm" && (
            <div className="scan-confirm">
              {preview ? (
                <p>
                  Check in <strong>{preview.name}</strong> to{" "}
                  <strong>{preview.event}</strong> (+{preview.points} pts)?
                </p>
              ) : feedback ? (
                <p>{feedback}</p>
              ) : (
                <p>Reading code…</p>
              )}

              <button
                type="button"
                onClick={handleConfirmScan}
                disabled={confirming || !preview}
              >
                {confirming ? "Checking in…" : "Confirm check-in"}
              </button>

              <button
                type="button"
                className="link-button"
                onClick={resumeScanning}
                disabled={confirming}
              >
                Rescan
              </button>
            </div>
          )}

          {phase === "done" && (
            <div className="scan-confirm">
              <p>{feedback}</p>

              <button type="button" onClick={resumeScanning}>
                Scan next person
              </button>
            </div>
          )}
        </>
      )}

      <form className="auth-form" onSubmit={handleManualSubmit}>
        <label>
          Didn&apos;t scan? Check in by email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="first.last@ontariotechu.net"
          />
        </label>

        <button type="submit" disabled={manualLoading || !eventId}>
          {manualLoading ? "Checking in…" : "Mark attended"}
        </button>
      </form>

      {phase === "scanning" && feedback && (
        <p role="status" aria-live="polite" className="scan-feedback">
          {feedback}
        </p>
      )}

      {eventId && (
        <div>
          <h2>RSVP&apos;d {rsvpsLoading ? '(loading...)' : `(${currentRsvps.length})`}</h2>

          {rsvpsLoading ? (
            <p style={{ color: '#666' }}>Loading attendees...</p>
          ) : currentRsvps.length > 0 ? (
            <ul className="rsvp-list">
              {currentRsvps.map((rsvp) => {
                const attended = rsvp.attended || justCheckedIn.has(`${eventId}:${rsvp.email.trim().toLowerCase()}`);

                return (
                  <li key={rsvp.email}>
                    {rsvp.name}
                    {rsvp.yearOfStudy ? ` (${rsvp.yearOfStudy})` : ""}{" "}
                    {attended ? (
                      "✅"
                    ) : (
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => handleRsvpCheckIn(rsvp)}
                      >
                        Check in
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ color: '#666' }}>No RSVPs for this event yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
