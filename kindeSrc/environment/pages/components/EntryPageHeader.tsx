import React from "react";
import { getKindeNonce, getDarkModeLogoUrl } from "@kinde/infrastructure";

export const EntryPageHeader = ({ logoAltText }) => {
  return (
    <>
      <style nonce={getKindeNonce()}>
        {`
          .c-strapline {
            color: #c6c6c6;
            font-size: 1.2rem;
            margin: 1rem auto;
            margin-top: 1rem;
            max-width: 22rem;
            padding: 0 1rem;
            text-align: center;
          }

          @media only screen and (min-width: 40em) {
            .c-strapline {
              font-size: 1.3rem;
            }
          }

          .c-strapline__highlight {
            color: #ff1493;
            font-weight: 700;
          }
        `}
      </style>
      <header>
        <img
          className="c-header"
          src={getDarkModeLogoUrl()}
          alt={logoAltText}
        />
        <p className="c-strapline">
          The <span className="c-strapline__highlight">free</span>,{" "}
          <span className="c-strapline__highlight">fun</span> and{" "}
          <span className="c-strapline__highlight">friendly</span>{" "}
          <span className="c-strapline__highlight">football prediction</span>{" "}
          game ⚽
        </p>
      </header>
    </>
  );
};
