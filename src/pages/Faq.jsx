import FaqItem from "../components/FaqItem";

import walkAroundPdf from "../assets/X RENTAL Walk-Around Form.pdf";
import roadsidePdf from "../assets/Y RENTAL Roadside info.pdf";
import claimReportingPdf from "../assets/Z RENTAL Claim Reporting Form.pdf";

export default function Faq() {
  const referralText =
    "We offer referral bonuses for connecting us with renters or buyers—send them our way and we’ll take care of the rest.";

  const trackerText =
    "Each vehicle is equipped with a GPS tracker for security and recovery. Tampering with, disabling, or removing a tracker violates the rental agreement and may result in the vehicle being reported as stolen.";

const walkAroundAnswer = (
  <>
    The Walk-Around Form is used at both pickup and return to document the vehicle’s condition and note any existing or new damage.
    <div style={{ marginTop: 8 }}>
      <a href={walkAroundPdf} target="_blank" rel="noreferrer">
        Open Walk-Around Form (PDF)
      </a>
    </div>
  </>
);

const roadsideAnswer = (
  <>
    Keep the Roadside Assistance Information document accessible during your rental. It outlines common issues and the steps to take if you need help.
    <div style={{ marginTop: 8 }}>
      <a href={roadsidePdf} target="_blank" rel="noreferrer">
        Open Roadside Info (PDF)
      </a>
    </div>
  </>
);

const claimAnswer = (
  <>
    If an accident, damage, or other incident occurs, complete the Claim Reporting Form to provide the details we’ll need to assist you.
    <div style={{ marginTop: 8 }}>
      <a href={claimReportingPdf} target="_blank" rel="noreferrer">
        Open Claim Reporting Form (PDF)
      </a>
    </div>
  </>
);


  return (
    <div style={{ width: "min(900px, 92%)", margin: "0 auto", padding: "28px 0 60px" }}>
      <h1 style={{ fontSize: "34px", margin: "0 0 10px" }}>FAQ</h1>

      <FaqItem
        q="What do I need to rent?"
        a="A valid driver’s license and a credit/debit card. We’ll confirm details when you request."
      />
      <FaqItem
        q="Can I pick up at the airport?"
        a="Yes—tell us your preferred pickup location in the request notes."
      />
      <FaqItem
        q="Do you allow same-day requests?"
        a="Often yes, depending on availability. Submit a request and we’ll respond quickly."
      />

      <FaqItem q="Do you offer referral bonuses?" a={referralText} />

      <FaqItem q="Do your vehicles have trackers?" a={trackerText} />

      <FaqItem q="What is the walk-around form?" a={walkAroundAnswer} />
      <FaqItem q="Where can I find roadside help information?" a={roadsideAnswer} />
      <FaqItem q="How do I report a claim or incident?" a={claimAnswer} />
    </div>
  );
}
