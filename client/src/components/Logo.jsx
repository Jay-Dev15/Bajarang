import wordmark from '../assets/logo-wordmark.png';
import mark from '../assets/logo-mark.png';

/** Square "B" cart icon. */
export function LogoMark({ className = 'size-10' }) {
  return <img src={mark} alt="" className={className} />;
}

/** Full BAJARANG wordmark (cart with vegetables). Image ratio is about 1.9 : 1. */
export default function Logo({ className = 'h-11 w-auto' }) {
  return <img src={wordmark} alt="BAJARANG" className={className} />;
}
