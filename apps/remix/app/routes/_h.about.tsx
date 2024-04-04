import { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "About Vmail" },
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
          About{" "}
        </h1>
        <p className="mt-8">
          <strong>Vmail.DEV </strong> is a Virtual temporary email service.{" "}
        </p>
        <p className="mt-4">
          You can get a temporary email without revealing any personal
          information, which greatly protects your privacy.{" "}
        </p>
        <p className="mt-4">
          It supports selecting one domain names, making it convenient for you
          to use in different scenarios.{" "}
        </p>
        <p className="mt-4">
          100% running on the <strong>Cloudflare </strong> network, providing
          you with a super-fast experience.{" "}
        </p>

        <p className="mt-4">
          Misuse of the temporary email service not only violates our terms of
          service but can also impact the normal use of other users. We
          encourage each user to use our services responsibly to ensure that
          resources are allocated and used appropriately.
        </p>

        <h2 className="mt-8 text-2xl font-bold" id="copyrights">
          <a href="#copyrights">Copyrights </a>
        </h2>
        <p className="mt-4">
          All copyrights belong to{" "}
          <a href="https://vmail.dev" rel="nofollow">
            <strong>Vmail.DEV </strong>{" "}
          </a>
          .{" "}
        </p>
      </div>
    </div>
  );
}
