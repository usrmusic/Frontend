import { ConfirmEventData } from "@/src/types/types";
import dayjs from "dayjs";
import Image from "next/image";
import React from "react";
import ContractActions from "./ContractActions";
import ContractFiles from "./ContractFiles";

type ContractEventLike = ConfirmEventData & {
  id?: number | string | null;
  contract_token?: string | null;
  contract_signed_at?: string | null;
  contract_pdf_url?: string | null;
};

const Contracts = ({ data }: { data: ConfirmEventData }) => {
  const ev = data as ContractEventLike;
  return (
    <div className="md:mx-[150px] mx-10">
      <ContractFiles eventId={ev?.id ?? null} />
      <ContractActions
        eventId={ev?.id ?? null}
        contractToken={ev?.contract_token ?? null}
        contractSignedAt={ev?.contract_signed_at ?? null}
        contractPdfUrl={ev?.contract_pdf_url ?? null}
      />
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
            {dayjs(new Date().toLocaleDateString()).format("DD MMM YYYY")}
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
            {/* <strong>Event Date:</strong> {dayjs(data.date).format("DD/MM/YYYY")} */}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-col md:flex-row gap-6">
        {/* Left Section */}
        <div className="md:w-7/12">
          <p className="text-[11pt]">
            Signed by{" "}
            <span id="client_name_temp" className="font-bold">
              {data?.users_events_user_idTousers?.name}
            </span>
            <br />
            for and on behalf of Client
          </p>
        </div>

        {/* Right Section */}
        <div className="md:w-5/12">
          {ev?.contract_signed_at ? (
            <div className="border border-green-200 rounded-md bg-green-50 p-4 flex items-center justify-center text-center min-h-[120px]">
              <div>
                <strong>Signed</strong>
                <br />
                <span className="text-sm">
                  {dayjs(ev.contract_signed_at).format("DD MMM YYYY HH:mm")}
                </span>
                {ev?.contract_pdf_url ? (
                  <div className="mt-2">
                    <a
                      className="underline text-sm"
                      href={ev.contract_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View signed PDF
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-md bg-[#f8d7da] p-4 flex items-center justify-center text-center min-h-[120px]">
              <div>
                <strong>No signature yet.</strong>
                <br />
                This document has not been signed.
              </div>
            </div>
          )}

          <p className="font-bold mt-2">Client</p>
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
              (i) You fail to make any payments...
              <br />
              (ii) You commit a serious breach...
            </p>
          </div>
        </div>
        {/* Table */}
        <div className="pl-14">
          <table className="w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">
                  Date of Client Cancellation
                </th>
                <th className="border p-2 text-left">Cancellation Costs</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">More than 8 months</td>
                <td className="border p-2">£1000</td>
              </tr>
              <tr>
                <td className="border p-2">4–8 months</td>
                <td className="border p-2">50%</td>
              </tr>
              <tr>
                <td className="border p-2">0–3 months</td>
                <td className="border p-2">100%</td>
              </tr>
            </tbody>
          </table>
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
