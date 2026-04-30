/**
 * CBAM QReport XML Generator — XSD v23.00
 * Namespace: http://xmlns.ec.eu/BusinessObjects/CBAM/Types/V1
 * Kaynak: QReport_ver23.00.xsd + stypes_ver23.00.xsd
 */

function esc(v: string | null | undefined): string {
  if (v == null) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tag(name: string, value: string | number | null | undefined, attrs?: string): string {
  if (value == null || value === "") return "";
  const a = attrs ? ` ${attrs}` : "";
  return `<${name}${a}>${esc(String(value))}</${name}>`;
}

function optTag(name: string, value: string | number | null | undefined): string {
  if (value == null || value === "" || value === 0) return "";
  return `<${name}>${esc(String(value))}</${name}>`;
}

// ─── Adres bloğu ──────────────────────────────────────────────
function addressBlock(prefix: string, o: Record<string, string | null | undefined>, type: "decl" | "std" | "install") {
  if (type === "decl") {
    return `
        <ActorAddress>
          ${optTag("SubDivision", o.subdivision)}
          ${tag("City", o.city)}
          ${tag("Street", o.street)}
          ${optTag("StreetAdditionalLine", o.street_additional)}
          ${optTag("Number", o.street_number)}
          ${optTag("Postcode", o.postcode)}
          ${optTag("POBox", o.po_box)}
        </ActorAddress>`;
  }
  if (type === "std") {
    return `
        <${prefix}Address>
          ${tag("Country", o.country)}
          ${optTag("SubDivision", o.subdivision)}
          ${optTag("City", o.city)}
          ${optTag("Street", o.street)}
          ${optTag("StreetAdditionalLine", o.street_additional)}
          ${optTag("Number", o.street_number)}
          ${optTag("Postcode", o.postcode)}
          ${optTag("POBox", o.po_box)}
        </${prefix}Address>`;
  }
  // install
  return `
        <Address>
          ${tag("EstablishmentCountry", o.country)}
          ${optTag("SubDivision", o.subdivision)}
          ${optTag("City", o.city)}
          ${optTag("Street", o.street)}
          ${optTag("StreetAdditionalLine", o.street_additional)}
          ${optTag("Number", o.street_number)}
          ${optTag("Postcode", o.postcode)}
          ${optTag("POBox", o.po_box)}
          ${optTag("PlotParcelNumber", o.plot_parcel_number)}
          ${o.latitude && o.longitude ? `<Latitude>${o.latitude}</Latitude><Longitude>${o.longitude}</Longitude><CoordinatesType>${o.coordinates_type ?? "01"}</CoordinatesType>` : ""}
        </Address>`;
}

// ─── Ana generator fonksiyonu ─────────────────────────────────
export function generateCBAMXml(data: CBAMReportData): string {
  const { report, goods } = data;
  const now = new Date().toISOString();

  const declarantBlock = `
    <Declarant>
      ${tag("IdentificationNumber", report.declarant_id_number)}
      ${tag("Name", report.declarant_name)}
      ${tag("Role", report.declarant_role ?? "01")}
      ${addressBlock("Declarant", {
        city: report.decl_city,
        street: report.decl_street,
        street_additional: report.decl_street_additional,
        street_number: report.decl_street_number,
        postcode: report.decl_postcode,
        subdivision: report.decl_subdivision,
        po_box: report.decl_po_box,
      }, "decl")}
    </Declarant>`;

  const representativeBlock = report.rep_id_number ? `
    <Representative>
      ${tag("IdentificationNumber", report.rep_id_number)}
      ${tag("Name", report.rep_name)}
      ${addressBlock("Representative", {
        country: report.rep_country,
        city: report.rep_city,
        street: report.rep_street,
        postcode: report.rep_postcode,
      }, "std")}
    </Representative>` : "";

  const importerBlock = report.importer_id_number ? `
    <Importer>
      ${tag("IdentificationNumber", report.importer_id_number)}
      ${tag("Name", report.importer_name)}
      ${addressBlock("Importer", {
        country: report.importer_country,
        city: report.importer_city,
        street: report.importer_street,
        postcode: report.importer_postcode,
      }, "std")}
    </Importer>` : "";

  const signaturesBlock = `
    <Signatures>
      <ReportConfirmation>
        <GlobalDataConfirmation>${report.global_data_confirmation ? "true" : "false"}</GlobalDataConfirmation>
        <UseOfDataConfirmation>${report.use_of_data_confirmation ? "true" : "false"}</UseOfDataConfirmation>
        ${tag("SignaturePlace", report.signature_place)}
        ${tag("Signature", report.signature)}
        ${tag("PositionOfPersonSending", report.position_of_person)}
      </ReportConfirmation>
      ${report.other_methodology_confirmation != null ? `
      <ApplicableMethodologyConfirmation>
        <OtherApplicableReportingMethodology>${report.other_methodology_confirmation ? "true" : "false"}</OtherApplicableReportingMethodology>
      </ApplicableMethodologyConfirmation>` : ""}
    </Signatures>`;

  const remarksBlock = report.remarks ? `
    <Remarks>
      ${tag("AdditionalInformation", report.remarks)}
    </Remarks>` : "";

  const goodsBlocks = goods.map((good) => {
    const qty = good.net_mass != null
      ? `<NetMass>${good.net_mass}</NetMass>`
      : good.supplementary_units != null
      ? `<SupplementaryUnits>${good.supplementary_units}</SupplementaryUnits>`
      : "";

    const measImported = good.net_mass != null
      ? `<NetMass>${good.net_mass}</NetMass>`
      : `<SupplementaryUnits>${good.supplementary_units}</SupplementaryUnits>`;

    const supportDocsBlock = (good.evidences ?? []).slice(0, 99).map((ev, idx) => {
      const filename = ev.file_url?.split("/").pop() ?? "document";
      const mime = filename.endsWith(".pdf") ? "application/pdf"
        : filename.endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : filename.endsWith(".xlsx") ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : filename.match(/\.(jpg|jpeg)$/i) ? "image/jpeg"
        : filename.endsWith(".png") ? "image/png"
        : "application/octet-stream";

      return `
        <SupportingDocuments>
          <SequenceNumber>${idx + 1}</SequenceNumber>
          <Type>01</Type>
          <Description>SHA-256: ${ev.verification_hash?.slice(0, 16) ?? ""}</Description>
          <Attachment>
            <Filename>${esc(filename)}</Filename>
            <URI>${esc(ev.file_url)}</URI>
            <MIME>${mime}</MIME>
          </Attachment>
        </SupportingDocuments>`;
    }).join("\n");

    const emissionsBlocks = (good.emissions ?? []).slice(0, 999).map((em, emIdx) => {
      const inst = em.installation;

      const operatorBlock = inst?.operator_name ? `
            <InstallationOperator>
              ${optTag("OperatorId", inst.operator_ref)}
              ${tag("OperatorName", inst.operator_name)}
              <OperatorAddress>
                ${tag("Country", inst.op_country ?? "TR")}
                ${optTag("City", inst.op_city)}
                ${optTag("Street", inst.op_street)}
                ${optTag("Postcode", inst.op_postcode)}
              </OperatorAddress>
              ${inst.op_contact_name || inst.op_phone || inst.op_email ? `
              <ContactDetails>
                ${optTag("Name", inst.op_contact_name)}
                ${optTag("Phone", inst.op_phone)}
                ${optTag("Email", inst.op_email)}
              </ContactDetails>` : ""}
            </InstallationOperator>` : "";

      const installBlock = inst?.installation_name ? `
            <Installation>
              ${tag("InstallationId", inst.installation_ref)}
              ${tag("InstallationName", inst.installation_name)}
              ${optTag("EconomicActivity", inst.economic_activity)}
              ${addressBlock("", {
                country: inst.country,
                subdivision: inst.subdivision,
                city: inst.city,
                street: inst.street,
                street_additional: inst.street_additional,
                street_number: inst.street_number,
                postcode: inst.postcode,
                po_box: inst.po_box,
                plot_parcel_number: inst.plot_parcel_number,
                latitude: String(inst.latitude ?? ""),
                longitude: String(inst.longitude ?? ""),
                coordinates_type: inst.coordinates_type,
              }, "install")}
            </Installation>` : "";

      const producedQty = em.produced_net_mass != null
        ? `<NetMass>${em.produced_net_mass}</NetMass>`
        : em.produced_supplementary_units != null
        ? `<SupplementaryUnits>${em.produced_supplementary_units}</SupplementaryUnits>`
        : `<NetMass>0</NetMass>`;

      const directBlock = `
            <DirectEmissions>
              ${optTag("DeterminationType", em.direct_determination_type)}
              ${tag("ApplicableReportingTypeMethodology", em.direct_reporting_type_method ?? "TOM02")}
              ${optTag("ApplicableReportingMethodology", em.direct_reporting_methodology)}
              ${tag("SpecificEmbeddedEmissions", em.direct_see)}
              <MeasurementUnit>${em.direct_measurement_unit ?? "EMU1"}</MeasurementUnit>
            </DirectEmissions>`;

      const indirectBlock = em.indirect_see != null ? `
            <IndirectEmissions>
              ${tag("DeterminationType", em.indirect_determination_type ?? "01")}
              ${optTag("EmissionFactorSource", em.indirect_ef_source)}
              ${em.indirect_ef != null ? tag("EmissionFactor", em.indirect_ef) : ""}
              ${tag("SpecificEmbeddedEmissions", em.indirect_see)}
              <MeasurementUnit>${em.indirect_measurement_unit ?? "EMU1"}</MeasurementUnit>
              ${em.indirect_electricity_consumed != null ? tag("ElectricityConsumed", em.indirect_electricity_consumed) : ""}
              ${optTag("ElectricitySource", em.indirect_electricity_source)}
              ${optTag("EmissionFactorSourceValue", em.indirect_ef_source_value)}
            </IndirectEmissions>` : "";

      const carbonPrices = (Array.isArray(em.carbon_prices) ? em.carbon_prices : [])
        .slice(0, 99)
        .map((cp: CarbonPrice, cpIdx: number) => `
            <CarbonPriceDue>
              <SequenceNumber>${cpIdx + 1}</SequenceNumber>
              ${tag("InstrumentType", cp.instrument_type)}
              ${tag("LegalActDescription", cp.legal_act)}
              <Amount>${cp.amount}</Amount>
              ${optTag("Currency", cp.currency)}
            </CarbonPriceDue>`).join("\n");

      const emRemarks = em.remarks ? `
            <RemarksEmissions>
              <SequenceNumber>1</SequenceNumber>
              ${tag("AdditionalInformation", em.remarks)}
            </RemarksEmissions>` : "";

      return `
          <GoodsEmissions>
            <SequenceNumber>${emIdx + 1}</SequenceNumber>
            ${optTag("ProductionCountry", em.production_country)}
            ${operatorBlock}
            ${installBlock}
            <ProducedMeasure>
              ${producedQty}
              <MeasurementUnit>${em.produced_measurement_unit ?? "01"}</MeasurementUnit>
            </ProducedMeasure>
            ${directBlock}
            ${indirectBlock}
            ${carbonPrices}
            ${emRemarks}
          </GoodsEmissions>`;
    }).join("\n");

    const goodRemarksBlock = good.remarks ? `
        <Remarks>
          ${tag("AdditionalInformation", good.remarks)}
        </Remarks>` : "";

    return `
      <ImportedGood>
        <ItemNumber>${good.item_number}</ItemNumber>
        ${good.hs_code || good.cn_code ? `
        <CommodityCode>
          ${tag("HsCode", good.hs_code?.slice(0, 6))}
          ${tag("CnCode", good.cn_code?.slice(0, 8))}
          <CommodityDetails>${good.commodity_description ? `<Description>${esc(good.commodity_description)}</Description>` : ""}</CommodityDetails>
        </CommodityCode>` : ""}
        <OriginCountry>
          <Country>${esc(good.origin_country)}</Country>
        </OriginCountry>
        <ImportedQuantity>
          <SequenceNumber>1</SequenceNumber>
          <Procedure>
            <RequestedProc>${esc(good.procedure_requested ?? "40")}</RequestedProc>
            ${optTag("PreviousProc", good.procedure_previous)}
          </Procedure>
          <ImportArea>
            <ImportArea>${esc(good.import_area ?? "EU")}</ImportArea>
          </ImportArea>
          <MeasureProcedureImported>
            <Indicator>${good.measure_indicator ?? "0"}</Indicator>
            ${qty}
            <MeasurementUnit>${esc(good.measurement_unit ?? "01")}</MeasurementUnit>
          </MeasureProcedureImported>
        </ImportedQuantity>
        <MeasureImported>
          ${measImported}
          <MeasurementUnit>${esc(good.measurement_unit ?? "01")}</MeasurementUnit>
        </MeasureImported>
        ${supportDocsBlock}
        ${goodRemarksBlock}
        ${emissionsBlocks}
      </ImportedGood>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<QReport xmlns="http://xmlns.ec.eu/BusinessObjects/CBAM/Types/V1">
  <SubmissionDate>${now}</SubmissionDate>
  <ReportingPeriod>${esc(report.reporting_period)}</ReportingPeriod>
  <Year>${report.year}</Year>
  ${declarantBlock}
  ${representativeBlock}
  ${importerBlock}
  ${signaturesBlock}
  ${remarksBlock}
  ${goodsBlocks}
</QReport>`;
}

// ─── Tipler ──────────────────────────────────────────────────
interface CarbonPrice {
  instrument_type: string;
  legal_act: string;
  amount: number;
  currency?: string;
}

export interface CBAMReportData {
  report: {
    id: string;
    reporting_period: string;
    year: number;
    declarant_id_number: string | null;
    declarant_name: string | null;
    declarant_role: string | null;
    decl_city: string | null;
    decl_street: string | null;
    decl_street_additional: string | null;
    decl_street_number: string | null;
    decl_postcode: string | null;
    decl_subdivision: string | null;
    decl_po_box: string | null;
    rep_id_number: string | null;
    rep_name: string | null;
    rep_country: string | null;
    rep_city: string | null;
    rep_street: string | null;
    rep_postcode: string | null;
    importer_id_number: string | null;
    importer_name: string | null;
    importer_country: string | null;
    importer_city: string | null;
    importer_street: string | null;
    importer_postcode: string | null;
    global_data_confirmation: boolean;
    use_of_data_confirmation: boolean;
    other_methodology_confirmation: boolean | null;
    signature_place: string | null;
    signature: string | null;
    position_of_person: string | null;
    remarks: string | null;
  };
  goods: {
    id: string;
    item_number: number;
    hs_code: string | null;
    cn_code: string | null;
    commodity_description: string | null;
    origin_country: string;
    procedure_requested: string | null;
    procedure_previous: string | null;
    import_area: string | null;
    net_mass: number | null;
    supplementary_units: number | null;
    measurement_unit: string | null;
    measure_indicator: string | null;
    remarks: string | null;
    evidences: { file_url: string; verification_hash: string }[];
    emissions: {
      id: string;
      production_country: string | null;
      produced_net_mass: number | null;
      produced_supplementary_units: number | null;
      produced_measurement_unit: string | null;
      direct_determination_type: string | null;
      direct_reporting_type_method: string | null;
      direct_reporting_methodology: string | null;
      direct_see: number | null;
      direct_measurement_unit: string | null;
      indirect_determination_type: string | null;
      indirect_ef_source: string | null;
      indirect_ef: number | null;
      indirect_see: number | null;
      indirect_measurement_unit: string | null;
      indirect_electricity_consumed: number | null;
      indirect_electricity_source: string | null;
      indirect_ef_source_value: string | null;
      carbon_prices: CarbonPrice[];
      remarks: string | null;
      installation: {
        installation_ref: string;
        installation_name: string;
        economic_activity: string | null;
        country: string;
        subdivision: string | null;
        city: string | null;
        street: string | null;
        street_additional: string | null;
        street_number: string | null;
        postcode: string | null;
        po_box: string | null;
        plot_parcel_number: string | null;
        latitude: number | null;
        longitude: number | null;
        coordinates_type: string | null;
        operator_ref: string | null;
        operator_name: string | null;
        op_country: string | null;
        op_city: string | null;
        op_street: string | null;
        op_postcode: string | null;
        op_contact_name: string | null;
        op_phone: string | null;
        op_email: string | null;
      } | null;
    }[];
  }[];
}
