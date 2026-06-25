import { Helmet } from "react-helmet-async";
import "./UnderConstructionPage.css";

export default function UnderConstructionPage() {
  return (
    <div className="uc">
      <Helmet>
        <title>Under Construction</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="uc__card">
        <img className="uc__logo" src="/images/Solimar.png" alt="Solimar" />
        <p className="uc__text">Site under construction, please come back later!</p>
      </div>
    </div>
  );
}
