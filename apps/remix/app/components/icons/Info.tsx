import { SVGProps } from "react";

export default function Info(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 26 26">
      <g
        fill="none"
        stroke="#0891b2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2">
        <path d="m12.802 2.165l5.575 2.389c.48.206.863.589 1.07 1.07l2.388 5.574c.22.512.22 1.092 0 1.604l-2.389 5.575c-.206.48-.589.863-1.07 1.07l-5.574 2.388c-.512.22-1.092.22-1.604 0l-5.575-2.389a2.036 2.036 0 0 1-1.07-1.07l-2.388-5.574a2.036 2.036 0 0 1 0-1.604l2.389-5.575c.206-.48.589-.863 1.07-1.07l5.574-2.388a2.036 2.036 0 0 1 1.604 0M12 9h.01" />
        <path d="M11 12h1v4h1" />
      </g>
    </svg>
  );
}
