// 这个文件内容直接从您的 _h.about.tsx 迁移而来
export function About() {
  return (
    <div className="text-black">
      <div className="max-w-[1400px] ">
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