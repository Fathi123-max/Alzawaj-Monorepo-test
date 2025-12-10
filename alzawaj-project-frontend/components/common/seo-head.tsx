import Head from "next/head";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  twitterTitle?: string;
  twitterDescription?: string;
  noindex?: boolean;
  keywords?: string[];
  structuredData?: object;
}

export function SEOHead({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage = "/og-image.svg",
  ogType = "website",
  twitterTitle,
  twitterDescription,
  noindex = false,
  keywords = [],
  structuredData,
}: SEOProps) {
  const baseUrl = process.env["NEXT_PUBLIC_APP_URL"];
  const fullTitle = title
    ? `${title} | الزواج السعيد`
    : "الزواج السعيد - منصة الزواج الإسلامية";
  const fullCanonical = canonical ? `${baseUrl}${canonical}` : baseUrl;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta key="description" name="description" content={description} />

      {keywords.length > 0 && (
        <meta key="keywords" name="keywords" content={keywords.join(", ")} />
      )}

      <link key="canonical" rel="canonical" href={fullCanonical} />

      {noindex && (
        <meta key="robots" name="robots" content="noindex,nofollow" />
      )}

      {/* Open Graph */}
      <meta key="og-title" property="og:title" content={ogTitle || fullTitle} />
      <meta
        key="og-description"
        property="og:description"
        content={ogDescription || description}
      />
      <meta key="og-type" property="og:type" content={ogType} />
      <meta key="og-url" property="og:url" content={fullCanonical} />
      <meta
        key="og-image"
        property="og:image"
        content={`${baseUrl}${ogImage}`}
      />
      <meta
        key="og-site-name"
        property="og:site_name"
        content="الزواج السعيد"
      />
      <meta key="og-locale" property="og:locale" content="ar_SA" />

      {/* Twitter Card */}
      <meta
        key="twitter-card"
        name="twitter:card"
        content="summary_large_image"
      />
      <meta
        key="twitter-title"
        name="twitter:title"
        content={twitterTitle || ogTitle || fullTitle}
      />
      <meta
        key="twitter-description"
        name="twitter:description"
        content={twitterDescription || ogDescription || description}
      />
      <meta
        key="twitter-image"
        name="twitter:image"
        content={`${baseUrl}${ogImage}`}
      />
      <meta key="twitter-site" name="twitter:site" content="@zawaj_platform" />

      {/* Additional Meta Tags */}
      <meta key="author" name="author" content="فريق الزواج السعيد" />
      <meta key="publisher" name="publisher" content="الزواج السعيد" />
      <meta
        key="application-name"
        name="application-name"
        content="الزواج السعيد"
      />
      <meta
        key="apple-mobile-web-app-title"
        name="apple-mobile-web-app-title"
        content="الزواج السعيد"
      />

      {/* Structured Data */}
      {structuredData && (
        <script
          key="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
    </Head>
  );
}
