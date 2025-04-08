"use server";

import React from "react";
import { renderToString } from "react-dom/server.browser";
import { getKindeWidget, getEnvironmentVariable } from "@kinde/infrastructure";

import { EntryPageHeader } from "../../components/EntryPageHeader";
import { NavTabs } from "../../components/NavTabs";
import { Layout } from "../../components/Layout";
const AGES_TEST_ENV = getEnvironmentVariable('AGES_TEST_ENV')?.value
const PageLayout = async ({ request, context }) => {
  return (
    <Layout request={request} context={context}>
      <main>
        <div className="c-widget">
          <EntryPageHeader logoAltText={context.widget.content.logoAlt} />
          <NavTabs activeTab="login" />
          
          <a href={`${AGES_TEST_ENV}`}>Check with dynamic link</a>
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
