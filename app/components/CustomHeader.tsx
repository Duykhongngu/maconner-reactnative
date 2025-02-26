import type React from "react";
import SiteHeader from "~/app/Header/header";
import AdminHeader from "~/app/Header/headerAdmin";

interface CustomHeaderProps {
  userRole: number | null;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ userRole }) => {
  if (userRole === 0) {
    return <AdminHeader />;
  }
  return <SiteHeader />;
};

export default CustomHeader;
