import { ConfirmEventData } from "@/src/types/types";
import dayjs from "dayjs";
import SignaturePad, { type SignaturePadHandle } from "@/src/components/common/SignaturePad";
import { useRef } from "react";
import Image from "next/image";



const Contracts = ({ data, isModifyMode, onSignatureChange }: { data: ConfirmEventData; isModifyMode?: boolean; onSignatureChange?: (uri: string | null) => void }) => {
  const padRef = useRef<SignaturePadHandle | null>(null);

  // Find the client signature URL across ALL contracts/signatures (not just [0]),
  // since contract ordering isn't guaranteed and a signed contract may not be first.
  const clientSignatureUrl = (() => {
    if (!Array.isArray(data?.contracts)) return null;
    for (const c of data.contracts) {
      if (!Array.isArray(c?.signatures)) continue;
      for (const s of c.signatures) {
        if (s?.signature_url) return String(s.signature_url);
      }
    }
    return null;
  })();

  const company = data?.company_names ?? data?.company ?? null;
  const adminSignatureUrl = company?.admin_signature_url ?? null;

  // The real signed date — was hardcoded to "today" regardless of when the
  // contract was actually signed. Prefer the signed contract's own
  // signed_at, fall back to the event's contract_signed_at.
  const signedAt = (() => {
    if (Array.isArray(data?.contracts)) {
      for (const c of data.contracts) {
        if (c?.signed_at) return c.signed_at;
      }
    }
    return data?.contract_signed_at ?? null;
  })();

  return (
    <div className="md:mx-[150px] mx-10">
      
      <Image
        src={"/images/contract_thumb.jpg"}
        alt="contract"
        width={394}
        height={500}
        className="max-w-[394px] h-[500px] m-auto object-cover"
      />
      <div className="text-center text-lg">
        <div className="my-4">
          <p>
            This contract has been prepared for{" "}
            <strong>{data?.users_events_user_idTousers?.name}</strong>
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {signedAt ? dayjs(signedAt).format("DD MMM YYYY") : "Not yet signed"}
          </p>
        </div>
        <div>
          <p>
            <strong>Venue:</strong> {data?.venues?.venue ?? data?.venue ?? "—"}
          </p>
          <p>
            <strong>Event Date:</strong> {data?.date ? dayjs(data.date).format("DD/MM/YYYY") : "—"}
          </p>
          <p>
            <strong>Package Price:</strong>{" "}
            {data?.total_cost_for_equipment != null && data.total_cost_for_equipment !== ""
              ? `£${Number(data.total_cost_for_equipment).toLocaleString("en-GB")}`
              : "—"}
          </p>
        </div>

        {/* Package summary (DJ name) + details (basics then extras, with extras notes) */}
        {Array.isArray(data?.event_packages) && data.event_packages.length > 0 && (
          <div className="text-left mt-3">
            <p className="font-bold">{data?.dj_name || data?.dj_package_name || ""}</p>
            <ul className="list-disc pl-6">
              {data.event_packages
                .slice()
                .sort((a, b) => Number(a.package_type_id) - Number(b.package_type_id))
                .map((p) => {
                  const qty = p.quantity && p.quantity > 1 ? `${p.quantity} X ` : "";
                  const name = p.equipment?.name ?? p.name ?? p.package_name ?? "Item";
                  return (
                    <li key={String(p.id)}>
                      {qty}
                      {name}
                      {Number(p.package_type_id) === 2 && p.notes ? (
                        <span className="block text-sm text-gray-600 whitespace-pre-line">
                          {p.notes}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
            </ul>
          </div>
        )}

        {/* Deposit + bank payment instructions (matches Laravel) */}
        <div className="pt-3">
          <p>
            Deposit payable £
            {data?.deposit_amount != null &&
            data.deposit_amount !== "" &&
            Number.isFinite(Number(data.deposit_amount))
              ? Number(data.deposit_amount).toLocaleString("en-GB")
              : "—"}{" "}
            on signature of Contract. Remaining balance of price payable 1 week before the event.
          </p>
          {company?.bank_name || company?.account_number || company?.sort_code ? (
            <p className="text-red-600">
              Please make payment to: Account Name: {company?.name || "—"}, Account No:{" "}
              {company?.account_number || "—"}, Sort Code: {company?.sort_code || "—"}
            </p>
          ) : null}
        </div>
      </div>

      {/* Intro paragraph (Laravel header → terms transition) */}
      <hr className="my-6 border-0 h-0.5 bg-black" />
      <p className="text-base text-gray-800">
        This contract is made up of these Contract Details above and the terms and conditions below
        (the &ldquo;Contract&rdquo;). The Contract has been entered into on the date stated at the
        beginning of it. By signing the below you agree to have read, understood and accept the terms
        of the Contract.
      </p>
      {/* Signature header removed — replaced by structured signature blocks below */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Company / Admin column */}
        <div>
          <p className="text-[11pt] font-semibold text-center">
            Signed by <span className="font-bold">{company?.contact_name || company?.name || "—"}</span>
            <br />
            <span className="text-sm">for and on behalf of {company?.name || "the company"}</span>
          </p>

          <div className="mt-3 bg-white rounded-md border border-gray-200 p-4 text-center">
            <div className="h-32 flex items-center justify-center bg-gray-50">
              {adminSignatureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={String(adminSignatureUrl)}
                  alt="Company signature"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-xs text-gray-500">No company signature image</div>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-2">Signature of company</p>
          </div>
        </div>

        {/* Client column */}
        <div>
          <p className="text-[11pt] font-semibold text-center">
            Signed by <span className="font-bold">{data?.users_events_user_idTousers?.name || "Client"}</span>
            <br />
            <span className="text-sm">for and on behalf of Client</span>
          </p>

          <div className="mt-3 bg-white rounded-md border border-gray-200 p-4 text-center">
            <div className="min-h-[140px] flex items-center justify-center bg-gray-50 w-full">
              {/* If in modify mode, show pad */}
              {isModifyMode ? (
                <div className="w-full max-w-[420px]">
                  <SignaturePad
                    ref={(r) => { padRef.current = r; }}
                    width={360}
                    height={120}
                    className="mx-auto"
                    onChange={(empty, dataUrl) => onSignatureChange?.(empty ? null : dataUrl)}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      className="text-xs text-gray-600 underline"
                      onClick={() => {
                        padRef.current?.clear();
                        onSignatureChange?.(null);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                // show existing client signature image if present
                clientSignatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={clientSignatureUrl}
                    alt="Client signature"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-gray-500">No client signature image</div>
                )
              )}
            </div>
            <p className="text-xs text-gray-600 mt-2">Signature of client</p>
          </div>
        </div>
      </div>

      <div className="section text-base text-gray-800 space-y-4 mt-5">
        <p className="font-bold">Agreed Terms and Conditions</p>
        {/* 1.1 */}
        <div className="font-bold flex">
          <span className="w-10 shrink-0">1.1</span>
          <span>Definitions</span>
        </div>
        <div className="pl-14 space-y-2">
          <p>
            <strong>Price:</strong> the charges payable by the Client for the
            supply of the Services by the USR, as set out in the Contract
            Details.
          </p>
          <p>
            <strong>Event Details:</strong> the date, location in which USR will
            provide its Services, as set out in the Contract Details.
          </p>
          <p>
            <strong>Services:</strong> the DJ entertainment package and
            associated services as further described in the Contract Details.
          </p>
        </div>
        {/* 2 */}
        <div className="font-bold flex">
          <span className="w-10 shrink-0">2.</span>
          <span>Package &amp; Supply of Services</span>
        </div>
        <div className="space-y-2">
          <div className="flex">
            <span className="font-bold w-10 shrink-0">2.1</span>
            <p className="pl-4">
              USR shall perform the Services and provide the Package on Event
              Date for the duration of the Event Period.
            </p>
          </div>
          <div className="flex">
            <span className="font-bold w-10 shrink-0">2.2</span>
            <p className="pl-4">
              In supplying the Services, USR shall perform the Services with
              reasonable care and skill.
            </p>
          </div>
          <div className="flex">
            <span className="font-bold w-10 shrink-0">2.3</span>
            <p className="pl-4">
              USR does not warrant that the Services will be uninterrupted or
              error-free. There may be brief stoppages or technical issues
              during the Event and USR will use reasonable endeavours to rectify
              such issues.
            </p>
          </div>
          <div className="flex">
            <span className="font-bold w-10 shrink-0">2.4</span>
            <p className="pl-4">
              The Client may request a date change prior to the Event Date or a
              variation to the Package. Such change may be subject to additional
              charges or Cancellation Costs (as set out at 5.7) if such date is
              not available. USR shall at their sole discretion confirm (in
              writing) if such change can be accommodated.
            </p>
          </div>
        </div>
        {/* 3 */}
        <div className="font-bold flex">
          <span className="w-10 shrink-0">3.</span>
          <span>Clients Obligations</span>
        </div>
        <div className="space-y-2">
          <div className="flex">
            <span className="font-bold w-10 shrink-0">3.1</span>
            <p className="pl-4">
              The Client shall co-operate with USR in all matters relating to
              the Services.
            </p>
          </div>
          <div className="flex">
            <span className="font-bold w-10 shrink-0">3.2</span>
            <p className="pl-4">
              If USRs performance of its obligations under the Contract is
              prevented or delayed by any act or omission of the Client (or
              venue staff) USR shall: a) not be liable for any costs, charges or
              losses sustained or incurred by the Client that arise directly or
              indirectly from such prevention or delay: and b) be entitled to
              payment of the Charges despite any such prevention or delay.
            </p>
          </div>
        </div>
        {/* 4 */}
        <div className="font-bold flex">
          <span className="w-10 shrink-0">4.</span>
          <span>Charges and payment</span>
        </div>
        <div className="space-y-2">
          <div className="flex">
            <span className="font-bold w-10 shrink-0">4.1</span>
            <p className="pl-4">
              In consideration for the provision of the Services, the Client
              shall pay USR the Charges in accordance with the Contract Details.
            </p>
          </div>
          <div className="flex">
            <span className="font-bold w-10 shrink-0">4.2</span>
            <p className="pl-4">
              The Deposit shall be deducted from the final payment. Once payment
              has been received, USR’s sole obligation is to provide the
              Services subject to the terms of this Contract.
            </p>
          </div>
        </div>
        {/* 5 */}
        <div className="flex">
          <span className="font-bold w-10 shrink-0">5</span>
          <p className="pl-4 font-bold">
            Liability &amp; Cancellation -
            <span className="underline">
              Clients Attention Is Particularly Drawn to This Clause
            </span>
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex">
            <span className="font-bold w-10 shrink-0">5.1</span>
            <p className="pl-4">
              Nothing in the Contract limits any liability where it is unlawful
              to do so.
            </p>
          </div>
          <div className="flex">
            <span className="font-bold w-10 shrink-0">5.2</span>
            <p className="pl-4">
              USR shall not be liable to the Client for any losses, damages,
              costs or expenses which are not reasonably foreseeable. Subject to
              5.1, USRs total liability to the Client shall be limited to 50%
              the total Price payable under this Contract.
            </p>
          </div>
          <div className="flex">
            <span className="font-bold w-10 shrink-0">5.3</span>
            <p className="pl-4">
              Client shall be responsible for any loss of or damage to any of
              USR equipment arising out of or in connection with any damage,
              misuse, theft, mishandling of USR equipment at the Event by the
              Client or their guests (unless such damage is caused by USR). The
              Client agrees to reimburse USR in full to remedy any such
              defects/damages to ensure that all USR equipment is in the same
              condition as it was prior to the Event.
            </p>
          </div>
          <div className="flex">
            <span className="font-bold w-10 shrink-0">5.4</span>
            <p className="pl-4">
              USR may cancel the Contract with immediate effect if:
              <br />
              (i) You fail to make any payments as specified in the Contract
              Details; or
              <br />
              (ii) You commit a serious breach of any term of this Contract.
            </p>
          </div>
          <div className="flex">
            <span className="font-bold w-10 shrink-0">5.5</span>
            <p className="pl-4">
              You may end your contract with us. However, your rights to any
              refund of the Price, or part thereof, will depend on when you
              decide to end your Contract or the reason in which the contract is
              ended. If you wish to cancel your Event, for whatever reason, you
              must contact us in writing (which can be by email to
              info@uniquesoundz.co.uk). Unless we agree otherwise with you, your
              cancellation will come into effect on the date that we confirm
              receipt of your request to cancel.
            </p>
          </div>
          <div className="flex">
            <span className="font-bold w-10 shrink-0">5.6</span>
            <p className="pl-4">
              Except where we are at fault, if you cancel your Event or this
              Contract, you agree that the Cancellation Costs set out in the
              Cancellation Costs Table (below) will apply and you agree that they
              will be payable by you to us.
            </p>
          </div>
          <div className="flex">
            <span className="font-bold w-10 shrink-0">5.7</span>
            <p className="pl-4">
              <strong>
                <u>
                  CANCELLATIONS COSTS TABLE – FOR CANCELLATIONS WHERE WE ARE NOT
                  AT FAULT
                </u>
              </strong>
              <br />
              The below Cancellation Costs have been carefully calculated as a
              pre-estimate only of our losses that directly result from your
              Event cancellation. This includes the costs of Services provided to
              you before cancellation, the unavoidable expenses we will incur and
              our direct loss of profit (including the value of your booked date
              and likelihood of us being able to rebook your cancelled Event).
            </p>
          </div>
        </div>
        {/* Cancellation Costs Table (full, matches Laravel) */}
        <div className="pl-14 space-y-2">
          <table className="w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">
                  Date of Client Cancellation
                </th>
                <th className="border p-2 text-left">
                  Cancellation Costs calculated as a percentage (%) of the Price
                  payable for the Event, as confirmed in the Contract Details.
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">More than 8 months before Event Date</td>
                <td className="border p-2">£1000 Cancellation Charge</td>
              </tr>
              <tr>
                <td className="border p-2">4–8 months before Event Date</td>
                <td className="border p-2">50% of Price payable</td>
              </tr>
              <tr>
                <td className="border p-2">0–3 months before Event Date</td>
                <td className="border p-2">100% of Price payable</td>
              </tr>
              <tr>
                <td className="border p-2" colSpan={2}>
                  Please Note: For very late cancellations you may also be
                  required to pay compensation to us for additional unavoidable
                  costs we incur as a result of your cancellation, if our costs
                  exceed the above Cancellation Costs. For example, for staffing,
                  pre-purchased products.
                </td>
              </tr>
            </tbody>
          </table>
          <p>
            The above Cancellation Costs will not apply if you cancel because we
            have breached our own obligations to you under your Contract.
          </p>
        </div>
        {/* 6 */}
        <div className="font-bold flex">
          <span className="w-10 shrink-0">6.</span>
          <span>General</span>
        </div>
        <div className="space-y-2">
          <div className="flex">
            <span className="font-bold w-10 shrink-0">6.1</span>
            <p className="pl-4">
              <strong>Force majeure.</strong> Neither party shall be in breach
              of the Contract nor liable for delay in performing, or failure to
              perform, any of its obligations under the Contract if such delay
              or failure result from events, circumstances or causes beyond its
              reasonable control. This includes but is not limited to any delay
              or failure to perform as a result of or in connection with acts of
              God (flood, drought, earthquake, other natural disaster, severe
              weather warning or adverse weather event); collapse of buildings,
              fire, explosion or accident; environmental issues which are not
              reasonably treatable/remediable; epidemic or pandemic (this
              includes but is not limited to COVID-19), any law or any action
              taken by a government or public authority, including without
              limitation imposing an export or import restriction, quota or
              prohibition; and interruption or failure of utility service.
            </p>
          </div>
          <div className="flex">
            <span className="font-bold w-10 shrink-0">6.2</span>
            <p className="pl-4">
              <strong>USR Packages.</strong> Packages are subject to Venue
              restrictions on power supply, smoke alarms, capacity, timing and
              other Venue rules and regulations. We shall not be liable for any
              such issues arising out of or in connection with the same. Any
              additional costs charged by the Venue to USR will be passed to the
              Client. USR reserve the right to change the Package to enhance the
              look and performance at their sole discretion. Please note, Dry
              Ice Machine service is subject to pellets being available and not
              melted prior to Event. Glow sticks are subject to ordered supply.
              USR do not take responsibility for any faulty or defective
              products.
            </p>
          </div>
          <div className="flex">
            <span className="font-bold w-10 shrink-0">6.3</span>
            <p className="pl-4">
              <strong>Entire agreement.</strong> The Contract constitutes the
              entire agreement between the parties and supersedes and
              extinguishes all previous agreements, promises, assurances,
              warranties, representations and understandings between them,
              whether written or oral, relating to its subject matter.
            </p>
          </div>
          <div className="flex">
            <span className="font-bold w-10 shrink-0">6.4</span>
            <p className="pl-4">
              <strong>Variation.</strong> No variation of the Contract shall be
              effective unless it is in writing and signed by the parties (or
              their authorised representatives).
            </p>
          </div>
          <div className="flex">
            <span className="font-bold w-10 shrink-0">6.5</span>
            <p className="pl-4">
              <strong>Governing Law &amp; Jurisdiction.</strong> The Contract,
              and any dispute or claim (including non-contractual disputes or
              claims) arising out of or in connection with it or its subject
              matter or formation, shall be governed by, and construed in
              accordance with the law of England and Wales and each party
              irrevocably agrees that the courts of England and Wales shall have
              exclusive jurisdiction to settle any dispute or claim (including
              non-contractual disputes or claims) arising out of or in
              connection with the Contract or its subject matter or formation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contracts;
