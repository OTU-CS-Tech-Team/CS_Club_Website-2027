"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
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
  rsvps,
}: {
  events: EventOption[];
  rsvps: Rsvp[];
}) {
  const [eventId, setEventId] = useState("");
  const [phase, setPhase] = useState<Phase>("scanning");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [feedback, setFeedback] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [email, setEmail] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState<Set<string>>(new Set());

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const eventIdRef = useRef(eventId);
  const pendingTokenRef = useRef<string | null>(null);

  // Used to make the scanner wait for a stable QR code
  const stableTokenRef = useRef<string | null>(null);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // How long the QR needs to remain detected before freezing
  const LOCK_TIME = 500;

  useEffect(() => {
    eventIdRef.current = eventId;
  }, [eventId]);

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

  /*
   * Once the same QR code has been detected for long enough,
   * actually capture/freeze the camera.
   */
  async function captureQRCode(token: string) {
    if (pendingTokenRef.current) return;

    pendingTokenRef.current = token;

    // Clear the stability timer
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    /*
     * Capture the current video frame.
     * This gives us the exact frame that was being displayed
     * when the QR code was locked in.
     */
    if (video && canvas && video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");

      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    }

    // NOW stop scanning.
    scannerRef.current?.pause();

    setPreview(null);
    setFeedback("");
    setPhase("confirm");

    /*
     * Only looking up the person;
     * we haven't actually checked them in yet.
     */
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

  /*
   * Called every time qr-scanner sees a QR code.
   *
   * Instead of immediately freezing:
   *
   * Detect -> wait -> confirm stability -> capture
   */
  function handleScan(token: string) {
    if (pendingTokenRef.current || !eventIdRef.current) {
      return;
    }

    /*
     * If this is a different QR code, restart the stability
     * timer.
     */
    if (stableTokenRef.current !== token) {
      stableTokenRef.current = token;

      if (lockTimerRef.current) {
        clearTimeout(lockTimerRef.current);
      }

      lockTimerRef.current = setTimeout(() => {
        /*
         * Only capture if:
         * 1. It's still the same QR code
         * 2. Nothing else has already been captured
         */
        if (stableTokenRef.current === token && !pendingTokenRef.current) {
          captureQRCode(token);
        }
      }, LOCK_TIME);

      return;
    }

    /*
     * Same QR is still being detected.
     *
     * Nothing needs to happen here because the timer
     * created above is already running.
     */
  }

  /*
   * Start the camera when an event is selected.
   */
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

  /*
   * Reset everything and start scanning again.
   */
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

  /*
   * Admin confirms the scanned person.
   */
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

      setFeedback(
        ok
          ? `✅ ${data.name} checked in to ${data.event} (+${data.points} pts)`
          : `⚠️ ${data.error ?? "Check-in failed"}`,
      );

      setPhase("done");
    } catch {
      /*
       * Nothing was recorded, so stay on the confirmation
       * screen and allow the admin to try again.
       */
      setFeedback("⚠️ Network error — not saved, tap Confirm again");
    } finally {
      setConfirming(false);
    }
  }

  /*
   * Manual email check-in.
   */
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

      setFeedback(
        ok
          ? `✅ ${data.name} checked in to ${data.event} (+${data.points} pts)`
          : `⚠️ ${data.error ?? "Check-in failed"}`,
      );

      if (ok) {
        setEmail("");
      }
    } catch {
      setFeedback("⚠️ Network error — try again");
    } finally {
      setManualLoading(false);
    }
  }

  /*
   * Check in someone directly from the RSVP list.
   */
  async function handleRsvpCheckIn(rsvp: Rsvp) {
    try {
      const { ok, data } = await postAttendance({
        email: rsvp.email,
      });

      setFeedback(
        ok
          ? `✅ ${data.name} checked in to ${data.event} (+${data.points} pts)`
          : `⚠️ ${data.error ?? "Check-in failed"}`,
      );

      if (ok) {
        setJustCheckedIn((prev) => new Set(prev).add(rsvp.email));
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

            /*
             * Switching events tears down and rebuilds the scanner, so drop
             * any held scan too — otherwise a pending confirm would check
             * that person into the event we just switched to.
             */
            pendingTokenRef.current = null;
            stableTokenRef.current = null;

            if (lockTimerRef.current) {
              clearTimeout(lockTimerRef.current);
              lockTimerRef.current = null;
            }

            setPreview(null);
            setFeedback("");
            setPhase("scanning");
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
          {/*
           * Live camera.
           *
           * qr-scanner provides the QR detection outline while
           * this is visible.
           */}
          <video
            ref={videoRef}
            className="scanner-video"
            muted
            playsInline
            autoPlay
            hidden={phase !== "scanning"}
          />

          {/*
           * Frozen camera frame.
           */}
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
            placeholder="member@email.com"
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

      {currentRsvps.length > 0 && (
        <div>
          <h2>RSVP&apos;d ({currentRsvps.length})</h2>

          <ul className="rsvp-list">
            {currentRsvps.map((rsvp) => {
              const attended = rsvp.attended || justCheckedIn.has(rsvp.email);

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
        </div>
      )}
    </div>
  );
}
