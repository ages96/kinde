"use server";

import React from "react";
import { renderToString } from "react-dom/server.browser";
import { getKindeWidget } from "@kinde/infrastructure";

import { EntryPageHeader } from "../../components/EntryPageHeader";
import { NavTabs } from "../../components/NavTabs";
import { Layout } from "../../components/Layout";

const PageLayout = async ({ request, context }) => {
  return (
    <Layout request={request} context={context}>
      <main>
        <div className="c-widget">
          <EntryPageHeader logoAltText={context.widget.content.logoAlt} />
          <NavTabs activeTab="sign_up" />
          <div>{getKindeWidget()}</div>
        </div>
      </main>
    </Layout>
  );
};

export default async function Page(event) {
  const page = await PageLayout({ ...event });
  return renderToString(page);
}
