import type { SocialPlatform } from '@/data/socials';
import { SOCIALS } from '@/data/socials';

type SocialIconProps = {
  id: SocialPlatform;
  className?: string;
  size?: number;
};

export default function SocialIcon({ id, className, size = 24 }: SocialIconProps) {
  const social = SOCIALS.find((s) => s.id === id);
  if (!social) return null;

  const viewBox = social.iconViewBox ?? '0 0 24 24';
  const isStrokeIcon = social.id === 'email';

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={viewBox}
      aria-hidden="true"
    >
      {isStrokeIcon ? (
        <path
          d={social.iconPath}
          fill={social.iconFill ?? 'currentColor'}
          fillRule="evenodd"
          clipRule="evenodd"
        />
      ) : (
        <path d={social.iconPath} fill={social.iconFill ?? 'currentColor'} />
      )}
    </svg>
  );
}
