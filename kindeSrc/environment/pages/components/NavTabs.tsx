import React from "react";
import {
  getKindeNonce,
  getKindeSignInUrl,
  getKindeSignUpUrl,
} from "@kinde/infrastructure";

export const NavTabs = ({ activeTab }) => {
  return (
    <>
      <style nonce={getKindeNonce()}>
        {`
          .c-nav-tabs {
            align-items: center;
            background-color: #010101;
            display: flex;
            opacity: 1;
            text-transform: uppercase;
            transition: opacity 250ms;
          }

          .c-nav-tabs__item {
            display: flex;
            width: 100%;
          }

          .c-nav-tabs__link {
            align-items: center;
            border-bottom: 2px solid transparent;
            color: #c6c6c6;
            display: flex;
            justify-content: center;
            padding: 1rem 0 0.75rem;
            text-align: center;
            text-decoration: none;
            width: 100%;
          }

          .c-nav-tabs__link.is-active {
            border-bottom-color: #ff1493;
            color: #fff;
          }

          .c-nav-tabs__link.is-active:focus,
          .c-nav-tabs__link:active {
            outline: none;
          }
          .c-nav-tabs--spacing-4x-large {
            margin-bottom: 1.5rem;
          }

          @media only screen and (min-width: 40em) {
            .c-nav-tabs--spacing-4x-large {
              margin-bottom: 3rem;
            }
          }

          .c-nav-tabs__link * {
            pointer-events: none;
          }
        `}
      </style>
      <ul className="c-nav-tabs c-nav-tabs--spacing-4x-large">
        <li className="c-nav-tabs__item" role="presentation">
          <a
            className={`c-nav-tabs__link ${activeTab === "login" ? "is-active" : ""}`}
            href={getKindeSignInUrl()}
          >
            <span className="c-nav-tabs__label">Login</span>
          </a>
        </li>
        <li className="c-nav-tabs__item" role="presentation">
          <a
            className={`c-nav-tabs__link ${activeTab === "sign_up" ? "is-active" : ""}`}
            href={getKindeSignUpUrl()}
          >
            <span className="c-nav-tabs__label">Sign Up</span>
          </a>
        </li>
      </ul>
    </>
  );
};
