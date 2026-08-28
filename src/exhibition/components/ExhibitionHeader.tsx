import { Link } from "react-router-dom";
import StarMark from "./StarMark";

interface ExhibitionHeaderProps {
  detail?: boolean;
}

export default function ExhibitionHeader({ detail = false }: ExhibitionHeaderProps) {
  return (
    <header className="ex-header">
      <Link className="ex-wordmark" to="/exhibition">
        <span>The Blackout Room</span>
        <StarMark className="ex-wordmark__star" />
      </Link>
      <nav aria-label="Exhibition navigation" className="ex-header__nav">
        {detail ? (
          <Link to="/exhibition">Back to all poems <span aria-hidden="true">→</span></Link>
        ) : (
          <>
            <Link aria-current="page" className="is-active" to="/exhibition">
              Exhibition
            </Link>
            <a href="https://github.com/CSSLab/llm-create2#readme">About the study</a>
          </>
        )}
      </nav>
    </header>
  );
}
