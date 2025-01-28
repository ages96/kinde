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
            color: #50C878;
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
          <span className="c-strapline__highlight">Testing Ages</span>
        </p>
      </header>
    </>
  );
};
