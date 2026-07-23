import { lakesideLoginUrl } from "@lib/api";

// "Sign in with Lakeside Games" door. Always drives
// sim.ahousedividedgame.com/api/lakeside/login (which bounces through the
// lakeside-auth broker) and returns to the current page with a one-time code,
// so it works from both sim.* and the lakesidegames.net mount.
export function LakesideButton() {
  return (
    <a className="lakeside-btn" href={lakesideLoginUrl()}>
      <img src="lakeside-mark.svg" alt="" width={22} height={22} />
      <span>
        <strong>Sign in with Lakeside Games</strong>
        <small>Your Lakeside Games account, one click, no new password</small>
      </span>
    </a>
  );
}

/** Hairline "or" divider between the Lakeside door and the local form. */
export function AuthDivider() {
  return (
    <div className="auth-divider" role="separator">
      <span>or use email</span>
    </div>
  );
}
