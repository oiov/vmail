export default function Notifications({}: {}) {
  return (
    <div className="w-full bg-gray-50/5 text-sm mt-20 text-white shadow-lg px-2 py-1.5 text-center z-50">
      <p className="">
        🎉 WR.DO Beta Launching Now!{" "}
        <a
          target="_blank"
          className="text-blue-500 ml-2 underline after:content-['_↗']"
          href="https://wr.do">
          Try it
        </a>
      </p>
    </div>
  );
}
