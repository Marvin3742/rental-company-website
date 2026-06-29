import { Helmet } from "react-helmet-async";
import { business } from "../data/business";

const SITE_URL = "https://solimareventrentals.com"; 

export default function SeoHead({ title, description, path = "/", image }) {
  const url = `${SITE_URL}${path}`;
  const fullTitle = title ? `${business.name} | ${title}` : business.name;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />

      {/* OpenGraph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={business.name} />
      {image && <meta property="og:image" content={`${SITE_URL}${image}`} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
    </Helmet>
  );
}
