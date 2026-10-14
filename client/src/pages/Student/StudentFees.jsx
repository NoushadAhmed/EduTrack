import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import StudentNavbar from '../../components/StudentNavbar';
import { PageShell } from '../../components/UI';
import { colors, font, radius, shadow } from '../../styles/theme';

const Content = styled.main`width:min(1180px,100%);margin:0 auto;padding:88px 24px 48px;font-family:${font.family};@media(max-width:600px){padding:72px 16px 36px}`;
const Intro = styled.div`margin-bottom:22px;h1{margin:0 0 6px;color:${colors.textPrimary};font-size:25px}p{margin:0;color:${colors.textMuted};font-size:14px;line-height:1.5}`;
const Card = styled.section`margin:0 0 18px;background:${colors.white};border:1px solid ${colors.border};border-radius:${radius.lg};box-shadow:${shadow.card};overflow:hidden`;
const Header = styled.div`padding:17px 20px;border-bottom:1px solid ${colors.border};display:flex;justify-content:space-between;align-items:center;gap:12px;h2{font-size:16px;margin:0;color:${colors.textPrimary}}span{font-size:12px;color:${colors.textMuted}}@media(max-width:560px){align-items:flex-start;flex-direction:column}`;
const Grid = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:12px;padding:18px`;
const Tile = styled.div`padding:14px;border:1px solid ${colors.border};border-radius:${radius.md};background:${colors.bgPage};span{display:block;color:${colors.textMuted};font-size:10px;text-transform:uppercase;letter-spacing:.04em}strong{display:block;margin-top:7px;color:${colors.textPrimary};font-size:17px}small{display:block;margin-top:5px;color:${colors.textMuted};font-size:11px}`;
const SummaryGrid = styled(Grid)`grid-template-columns:repeat(auto-fit,minmax(190px,1fr))`;
const TableWrap = styled.div`width:100%;overflow-x:auto;table{width:100%;min-width:760px;border-collapse:collapse;text-align:left}th,td{padding:12px 15px;border-top:1px solid ${colors.border};font-size:12px;white-space:nowrap;vertical-align:top}th{background:#f8fafc;color:${colors.textSecondary};font-size:10px;text-transform:uppercase;letter-spacing:.04em}td{color:${colors.textPrimary}}button{color:${colors.primary};border:0;background:none;text-decoration:underline;cursor:pointer;font:600 12px ${font.family}}`;
const Status = styled.span`display:inline-block;padding:5px 9px;border-radius:999px;background:${({$status})=>$status==='Paid'?'#ecfdf3':$status==='Pending'?'#fff7e6':$status==='Partially Paid'?'#eff8ff':'#f2f4f7'};color:${({$status})=>$status==='Paid'?'#067647':$status==='Pending'?'#9a6700':$status==='Partially Paid'?'#175cd3':colors.textSecondary};font-weight:700;font-size:10px`;
const State = styled.div`padding:28px 20px;color:${colors.textSecondary};font-size:14px;text-align:center`;
const Section = styled.section`margin-top:22px`;
const money = (value) => value === null || value === undefined ? 'Not assessed' : `₹${Number(value || 0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const dateLabel = (value) => value ? new Date(value).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : 'Not available';
const safeHtml = (value) => String(value || '—').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export default function StudentFees() {
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');

  useEffect(() => {
    let active = true;
    axios.get('/api/student/fees')
      .then(({data: response}) => { if (active) setData(response); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load fees.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  },[]);

  const payments = useMemo(() => (data?.result || []).flatMap((record) => (record.payments || []).map((payment) => ({
    ...payment,
    academicYear: record.academicYear,
    semester: record.semester,
    feeRecord: record,
    status: 'Recorded',
  }))).sort((left,right) => new Date(right.paymentDate || 0) - new Date(left.paymentDate || 0)),[data]);

  const printReceipt = (payment) => {
    const win = window.open('','_blank');
    if (!win) return;
    win.document.write(`<html><head><title>EduTrack Receipt</title><style>body{font:15px Arial;max-width:700px;margin:48px auto;padding:28px;border:1px solid #ccd3dc;color:#1d2939}h1{color:#176b87}hr{border:0;border-top:1px solid #ddd}p{line-height:1.7}</style></head><body><h1>EduTrack Payment Receipt</h1><hr/><p><b>Student:</b> ${safeHtml(data?.student?.name)}<br/><b>Student ID / USN:</b> ${safeHtml(data?.student?.registrationNumber)}<br/><b>Receipt number:</b> ${safeHtml(payment.receiptNumber)}<br/><b>Transaction number:</b> ${safeHtml(payment.transactionId)}<br/><b>Academic Year:</b> ${safeHtml(payment.academicYear)}<br/><b>Semester:</b> ${safeHtml(payment.semester)}<br/><b>Amount:</b> ${safeHtml(money(payment.amount))}<br/><b>Payment date:</b> ${safeHtml(dateLabel(payment.paymentDate))}<br/><b>Method:</b> ${safeHtml(payment.paymentMode)}<br/><b>Status:</b> Recorded</p><script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };

  if (loading) return <PageShell><StudentNavbar/><Content><Intro><h1>Fees &amp; Receipts</h1></Intro><Card><State>Loading fee information...</State></Card></Content></PageShell>;

  return <PageShell>
    <StudentNavbar/>
    <Content>
      <Intro>
        <h1>Fees &amp; Receipts</h1>
        <p>Review your assessed course fees, year and semester breakdowns, and recorded payments.</p>
      </Intro>
      {error && <Card><State role="alert">{error}</State></Card>}
      {!error && data && <>
        <Card>
          <Header><h2>Student Information</h2><span>Authenticated student record</span></Header>
          <Grid>
            <Tile><span>Student Name</span><strong>{data.student?.name || 'Not available'}</strong></Tile>
            <Tile><span>Student ID / USN</span><strong>{data.student?.registrationNumber || 'Not available'}</strong></Tile>
            <Tile><span>Department and Year</span><strong>{data.student?.department || 'Not available'} · Year {data.student?.year || '—'}</strong></Tile>
            <Tile><span>Current Academic Year</span><strong>{data.currentAcademic?.academicYear || 'Not available'}</strong></Tile>
            <Tile><span>Last Fee Record Update</span><strong>{dateLabel(data.lastUpdatedAt)}</strong></Tile>
          </Grid>
        </Card>

        <Card>
          <Header><h2>Course Fee Summary</h2><span>Totals use unique assessed semester fee records only</span></Header>
          <SummaryGrid>
            <Tile><span>Total Fees · Assessed Across Course</span><strong>{data.summary?.assessedTerms ? money(data.summary.totalFees) : 'Not assessed'}</strong><small>Course duration: 4 years</small></Tile>
            <Tile><span>Total Fees Paid</span><strong>{payments.length ? money(data.summary?.feesPaid) : 'No payments recorded'}</strong><small>Across all assessed years</small></Tile>
            <Tile><span>Total Pending Fees</span><strong>{data.summary?.assessedTerms ? money(data.summary.pendingFees) : 'Not assessed'}</strong><small>Assessed fees less recorded payments</small></Tile>
            <Tile><span>Current Academic Year Pending</span><strong>{data.summary?.currentAcademicYearPendingFees === null ? 'Not assessed' : money(data.summary?.currentAcademicYearPendingFees)}</strong><small>{data.currentAcademic?.academicYear || 'Current year'}</small></Tile>
            <Tile><span>Current Semester</span><strong>Semester {data.currentAcademic?.semester || '—'}</strong><small>{data.currentAcademic?.academicYear || ''}</small></Tile>
          </SummaryGrid>
        </Card>
        {!data.result?.length && <Card><State>No student fee assessments have been recorded. Configured structures below are not counted as assessed fees.</State></Card>}

        <Card>
          <Header><h2>Year-wise Fee Breakdown</h2><span>Missing assessments are not counted as paid or pending fees</span></Header>
          <TableWrap><table><thead><tr><th>Course Year</th><th>Academic Year(s)</th><th>Total Fee</th><th>Amount Paid</th><th>Outstanding</th><th>Status</th><th>Last Updated</th></tr></thead><tbody>
            {(data.yearBreakdown || []).map((item) => <tr key={item.year}>
              <td>Year {item.year}</td><td>{item.academicYears?.length ? item.academicYears.join(', ') : 'Not assessed'}</td>
              <td>{item.totalFee === null && item.paymentStatus === 'Not configured' ? 'Not configured' : money(item.totalFee)}</td>
              <td>{item.assessed ? money(item.amountPaid) : 'No payments recorded'}</td><td>{money(item.outstandingAmount)}</td>
              <td><Status $status={item.paymentStatus}>{item.paymentStatus}</Status></td><td>{dateLabel(item.lastUpdatedAt)}</td>
            </tr>)}
          </tbody></table></TableWrap>
        </Card>

        <Section>
          <Card>
            <Header><h2>Semester-wise Fee Details</h2><span>Tuition and other configured categories are shown per term</span></Header>
            {(data.semesterDetails || []).length ? <TableWrap><table><thead><tr><th>Academic Year</th><th>Year / Semester</th><th>Total Fee</th><th>Paid</th><th>Outstanding</th><th>Tuition Fee</th><th>Other Fee Categories</th><th>Status</th></tr></thead><tbody>
              {data.semesterDetails.map((term) => <tr key={`${term.academicYear}-${term.semester}`}>
                <td>{term.academicYear}</td><td>Year {term.year} · Semester {term.semester}</td><td>{money(term.totalFee)}</td>
                <td>{term.assessed ? money(term.amountPaid) : 'No payments recorded'}</td><td>{term.assessed ? money(term.outstandingAmount) : 'Not assessed'}</td>
                <td>{term.components?.some((item) => /tuition/i.test(item.category)) ? money(term.tuitionFee) : 'Not configured'}</td>
                <td>{term.components?.filter((item) => !/tuition/i.test(item.category)).length ? term.components.filter((item) => !/tuition/i.test(item.category)).map((item) => `${item.category}: ${money(item.amount)}`).join(' · ') : 'Not configured'}</td>
                <td><Status $status={term.paymentStatus}>{term.paymentStatus}</Status></td>
              </tr>)}
            </tbody></table></TableWrap> : <State>No fee structures or assessments are configured for the available academic years.</State>}
          </Card>
        </Section>

        <Card>
          <Header><h2>Payment History &amp; Receipts</h2><span>{payments.length} recorded payment{payments.length === 1 ? '' : 's'}</span></Header>
          {payments.length ? <TableWrap><table><thead><tr><th>Payment Date</th><th>Receipt Number</th><th>Transaction Number</th><th>Amount</th><th>Method</th><th>Academic Year</th><th>Semester</th><th>Status</th><th>Receipt</th></tr></thead><tbody>
            {payments.map((payment) => <tr key={`${payment.feeRecord._id}-${payment._id}`}>
              <td>{dateLabel(payment.paymentDate)}</td><td>{payment.receiptNumber || 'Not provided'}</td><td>{payment.transactionId || 'Not provided'}</td><td>{money(payment.amount)}</td>
              <td>{payment.paymentMode || 'Not provided'}</td><td>{payment.academicYear}</td><td>{payment.semester}</td><td>{payment.status}</td>
              <td><button type="button" onClick={() => printReceipt(payment)}>View / Print receipt</button></td>
            </tr>)}
          </tbody></table></TableWrap> : <State>No payments recorded.</State>}
        </Card>
      </>}
    </Content>
  </PageShell>;
}
