import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { AccountsPage } from "./pages/AccountsPage";
import { ApisPage } from "./pages/ApisPage";
import { PermissionsPage } from "./pages/PermissionsPage";
import { UsagePage } from "./pages/UsagePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/accounts" replace /> },
      { path: "accounts", element: <AccountsPage /> },
      { path: "permissions", element: <PermissionsPage /> },
      { path: "usage", element: <UsagePage /> },
      { path: "apis", element: <ApisPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
