import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  bgColor: string;
  href?: string;
}

export default function StatCard({ title, value, icon, bgColor, href }: StatCardProps) {
  const Content = () => (
    <>
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 text-white ${bgColor} rounded-lg`}>
            {icon}
          </div>
          <div className="flex-1 w-0 ml-5">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-2xl font-semibold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="px-5 py-3 bg-gray-50">
        <div className="text-sm">
          <a href={href || "#"} className="font-medium text-primary hover:text-primary-dark">
            View all
          </a>
        </div>
      </div>
    </>
  );

  return (
    <div className="overflow-hidden bg-white rounded-lg shadow">
      {href ? (
        <a href={href} className="block">
          <Content />
        </a>
      ) : (
        <Content />
      )}
    </div>
  );
}
