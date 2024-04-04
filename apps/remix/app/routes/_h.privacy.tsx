import { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Privacy Policy" },
    {
      name: "description",
      content:
        "Virtual temporary Email. Privacy friendly, Valid for 1 day, AD friendly, 100% Run on Cloudflare",
    },
  ];
};

export default function Index() {
  return (
    <div className="mx-10 mt-28 text-white">
      <div className="max-w-[1400px] ">
        <h1 className="text-4xl font-bold" id="about">
          Privacy Policy
        </h1>
        <p className="mt-8">
          At Vmail.DEV, we value the privacy of our users and are committed to
          protecting their personal information. This Privacy Policy outlines
          the practices we follow regarding the collection, use, storage, and
          deletion of data on our one-time email website.
        </p>

        <h2 className="mt-8 text-2xl font-bold" id="Collection of Information">
          1. Collection of Information
        </h2>
        <p className="mt-4">
          We only collect and store an email name for the duration of the
          session. This information is necessary to facilitate the functioning
          of our one-time email service.
        </p>

        <h2 className="mt-8 text-2xl font-bold" id="Storage of Emails">
          2. Storage of Emails
        </h2>
        <p className="mt-4">
          All emails sent and received through our one-time email service are
          temporarily stored in Cloudflare data centers. This storage is
          essential for the proper delivery and retrieval of emails during the
          active session.
        </p>

        <h2 className="mt-8 text-2xl font-bold" id="Deletion of Emails">
          3. Deletion of Emails
        </h2>
        <p className="mt-4">
          Once an email expires, we ensure the complete deletion of the email
          from our system. This means that all associated data, including the
          email content and any related information, will be permanently removed
          from our servers.
        </p>

        <h2 className="mt-8 text-2xl font-bold" id="Data Security">
          4. Data Security
        </h2>
        <p className="mt-4">
          We take appropriate measures to protect the personal information and
          emails stored on our website. However, it is important to note that no
          method of data transmission or storage is completely secure. While we
          strive to use commercially acceptable means to protect user data, we
          cannot guarantee absolute security.
        </p>

        <h2 className="mt-8 text-2xl font-bold" id="Third-Party Services">
          5. Third-Party Services
        </h2>
        <p className="mt-4">
          We may use third-party services, such as Cloudflare, to assist in the
          operation and maintenance of our website. These third-party services
          may have access to certain user data, including email names and
          content, solely for the purpose of providing their services. We ensure
          that any third-party services we use are reputable and have
          appropriate data protection measures in place.
        </p>

        <h2 className="mt-8 text-2xl font-bold" id="">
          6. Information Sharing
        </h2>
        <p className="mt-4">
          We do not share, sell, or disclose any personal information or email
          content to third parties, except as required by law or as necessary to
          protect our rights, property, or safety.
        </p>

        <h2 className="mt-8 text-2xl font-bold" id="Cookies">
          7. Cookies
        </h2>
        <p className="mt-4">
          We may use cookies to enhance the user experience on our website.
          These cookies may collect non-personal information and are used solely
          for website analytics and functionality purposes.
        </p>

        <h2 className="mt-8 text-2xl font-bold" id="Children's Privacy">
          8. Children's Privacy
        </h2>
        <p className="mt-4">
          Our website is not intended for use by individuals under the age of
          13. We do not knowingly collect personal information from children. If
          you believe that we may have inadvertently collected personal
          information from a child under 13, please contact us immediately, and
          we will take appropriate steps to delete such information.
        </p>

        <h2
          className="mt-8 text-2xl font-bold"
          id="Changes to the Privacy Policy">
          9. Changes to the Privacy Policy
        </h2>
        <p className="mt-4">
          We reserve the right to modify or update this Privacy Policy at any
          time. Any changes made will be effective immediately upon posting the
          revised Privacy Policy on our website. It is advisable to review this
          Privacy Policy periodically for any updates.
        </p>

        <h2 className="mt-8 text-2xl font-bold" id="Contact Us">
          10. Contact Us
        </h2>
        <p className="mt-4">
          If you have any questions, concerns, or feedback regarding this
          Privacy Policy or our website's privacy practices, please contact us.
        </p>
        <p className="mt-8">Last updated: 2024-03-15</p>
      </div>
    </div>
  );
}
