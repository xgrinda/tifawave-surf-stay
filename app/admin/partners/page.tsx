import {
  EnquiryWorkspace,
  type EnquiryParams,
} from "../_components/enquiry-workspace";
export default async function Partners({
  searchParams,
}: {
  searchParams: Promise<EnquiryParams>;
}) {
  return <EnquiryWorkspace area="partners" params={await searchParams} />;
}
