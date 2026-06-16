import { useState } from "react";
import { portraitFor } from "@content/portraits";

// A round portrait that always renders something: the person's photo when we
// have one, otherwise a colored initials avatar. Fixes the "no image loads"
// case for candidates / running mates we don't ship a JPG for.
export function Avatar({
  name,
  color = "var(--navy-500)",
  size = 44,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const src = portraitFor(name);
  const [failed, setFailed] = useState(false);
  const base = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    border: "2px solid var(--border)",
  } as const;

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        style={{ ...base, objectFit: "cover" }}
        onError={() => setFailed(true)}
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      aria-label={name}
      style={{
        ...base,
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: Math.round(size * 0.38),
        color: "#fff",
        letterSpacing: "0.5px",
      }}
    >
      {initials}
    </div>
  );
}
