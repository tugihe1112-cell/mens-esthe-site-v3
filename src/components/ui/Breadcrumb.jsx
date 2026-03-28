import React from "react";
import { Link } from "react-router-dom";

export default function Breadcrumb({ items, className = "" }) {
  return (
    <nav className={`text-sm text-gray-400 ${className}`} aria-label="Breadcrumb">
      <ol className="list-none p-0 inline-flex flex-wrap items-center">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-600">/</span>
              )}
              {isLast || !item.path ? (
                <span className={isLast ? "text-white font-medium" : "text-gray-400"}>
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="hover:text-pink-400 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
