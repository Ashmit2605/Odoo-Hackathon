import { useCallback } from "react";
import { useParams } from "react-router-dom";
import ResourcePage from "../../components/ResourcePage.jsx";
import { getCustomer } from "../../services/customerService.js";

export default function CustomerDetails() {
  const { id } = useParams();
  const load = useCallback(() => getCustomer(id), [id]);
  return <ResourcePage title="Customer details" load={load} columns={[]} recordId={id} />;
}
