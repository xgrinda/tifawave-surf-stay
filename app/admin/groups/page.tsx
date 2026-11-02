import {
  EnquiryWorkspace,
  type EnquiryParams,
} from "../_components/enquiry-workspace";
export default async function Groups({
  searchParams,
}: {
  searchParams: Promise<EnquiryParams>;
}) {
  return <EnquiryWorkspace area="groups" params={await searchParams} />;
}
