import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Search, Close, Add, Payment, Edit, ExpandMore, ExpandLess, Settings } from '@material-ui/icons';
import AdminNavbar from '../../components/AdminNavbar';
import { Btn, Card, Input, Label, PageShell, PageTitle, Select, Subtitle } from '../../components/UI';
import { ADMIN_DEPARTMENTS, ADMIN_SEMESTERS, ACADEMIC_YEARS } from '../../config/adminOptions';
import { colors, font, radius, shadow, transition } from '../../styles/theme';

const fadeUp  = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const slideIn = keyframes`from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:translateX(0)}`;

/* ── layout ── */
const Content = styled.main`
  width:min(1240px,100%);margin:0 auto;padding:36px 24px 56px;
  font-family:${font.family};animation:${fadeUp} .28s ease both;
  @media(max-width:600px){padding:24px 16px 40px}
`;
const PageHeader = styled.div`
  display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px;
  ${PageTitle}{margin-bottom:5px}${Subtitle}{margin:0}
  @media(max-width:560px){flex-direction:column}
`;
const StatGrid = styled.div`
  display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:22px;
`;
const StatCard = styled(Card)`
  padding:18px 20px;
  span{display:block;color:${colors.textMuted};font-size:11px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}
  strong{display:block;color:${colors.textPrimary};font-size:22px;font-weight:700}
`;
const FilterCard = styled(Card)`
  display:grid;
  grid-template-columns:minmax(200px,1.6fr) repeat(3,minmax(120px,1fr)) auto;
  gap:12px;align-items:flex-end;padding:16px 18px;margin-bottom:20px;
  @media(max-width:900px){grid-template-columns:repeat(3,minmax(0,1fr))}
  @media(max-width:560px){grid-template-columns:repeat(2,minmax(0,1fr))}
  @media(max-width:380px){grid-template-columns:1fr}
`;
const Field = styled.div`display:flex;flex-direction:column;gap:6px;min-width:0`;
const SearchWrap = styled.div`
  position:relative;
  svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:${colors.textMuted};font-size:18px!important;pointer-events:none}
  input{padding-left:38px}
`;
const ResultsBar = styled.div`
  display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 1px 12px;
  color:${colors.textMuted};font-size:12px;
  strong{color:${colors.textPrimary};font-size:14px;font-weight:600}
`;
const TableWrap = styled.div`
  background:${colors.white};border:1px solid ${colors.border};border-radius:${radius.lg};
  box-shadow:${shadow.card};overflow-x:auto;
  table{width:100%;min-width:860px;border-collapse:collapse;text-align:left}
  th,td{padding:12px 15px;border-bottom:1px solid ${colors.border};font-size:13px;white-space:nowrap}
  th{color:${colors.textMuted};background:#F8FAFC;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
  td{color:${colors.textSecondary}}
  tbody tr{transition:${transition.fast};cursor:pointer}
  tbody tr:hover{background:#F0F4FF}
  tbody tr:last-child td{border-bottom:0}
  td strong{color:${colors.textPrimary};font-weight:600}
`;
const SBadge = styled.span`
  display:inline-flex;align-items:center;padding:3px 9px;border-radius:${radius.full};font-size:11px;font-weight:700;
  ${({$s})=>{
    if($s==='Paid')           return 'background:#D1FAE5;color:#065F46';
    if($s==='Partially Paid') return 'background:#DBEAFE;color:#1E40AF';
    if($s==='Pending')        return 'background:#FEF3C7;color:#92400E';
    return `background:${colors.bgPage};color:${colors.textSecondary}`;
  }}
`;
const ActionBtn = styled.button`
  display:inline-flex;align-items:center;gap:4px;min-height:30px;padding:0 10px;
  border:1px solid ${colors.border};border-radius:${radius.sm};color:${colors.textSecondary};
  background:${colors.white};font:500 12px ${font.family};cursor:pointer;transition:${transition.fast};
  svg{font-size:15px!important}
  &:hover{color:${colors.primary};border-color:${colors.primary};background:${colors.primaryLight}}
`;
const Empty = styled.div`
  padding:48px 24px;text-align:center;color:${colors.textMuted};font-size:13px;
  background:${colors.white};border:1px solid ${colors.border};border-radius:${radius.lg};
  h4{font-size:15px;font-weight:600;color:${colors.textSecondary};margin:0 0 6px}
  p{margin:0;line-height:1.5}
`;
/* ── drawer ── */
const Overlay  = styled.div`position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:200;animation:${fadeUp} .18s ease both`;
const Drawer   = styled.div`
  position:fixed;top:0;right:0;bottom:0;width:min(680px,100vw);background:${colors.white};
  box-shadow:-4px 0 32px rgba(0,0,0,.14);z-index:201;display:flex;flex-direction:column;
  animation:${slideIn} .22s ease both;overflow:hidden
`;
const DrawerHead = styled.div`
  display:flex;align-items:center;justify-content:space-between;padding:18px 24px;
  border-bottom:1px solid ${colors.border};flex-shrink:0;
  h2{margin:0;font-size:17px;font-weight:700;color:${colors.textPrimary}}
  p{margin:2px 0 0;font-size:12px;color:${colors.textMuted}}
`;
const CloseBtn = styled.button`
  width:34px;height:34px;border:none;border-radius:${radius.md};background:transparent;cursor:pointer;
  color:${colors.textMuted};display:flex;align-items:center;justify-content:center;transition:${transition.fast};
  svg{font-size:20px!important}
  &:hover{background:${colors.bgPage};color:${colors.textPrimary}}
`;
const DrawerBody = styled.div`flex:1;overflow-y:auto;padding:20px 24px 32px`;
const DrawerFoot = styled.div`
  display:flex;gap:10px;padding:14px 24px;border-top:1px solid ${colors.border};flex-shrink:0;flex-wrap:wrap
`;
const Sec      = styled.div`margin-bottom:22px`;
const SecLabel = styled.div`
  font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:${colors.textMuted};
  margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid ${colors.border};
  display:flex;align-items:center;justify-content:space-between
`;
const InfoGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px`;
const InfoTile = styled.div`
  padding:10px 12px;background:${colors.bgPage};border:1px solid ${colors.border};border-radius:${radius.md};
  span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:${colors.textMuted};margin-bottom:4px}
  strong{display:block;font-size:13px;font-weight:600;color:${colors.textPrimary}}
`;
const FormGrid = styled.div`
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;
  @media(max-width:480px){grid-template-columns:1fr}
`;
const CompRow  = styled.div`
  display:grid;grid-template-columns:1fr 140px 32px;gap:8px;align-items:flex-end;margin-bottom:8px
`;
const RemBtn   = styled.button`
  width:32px;height:42px;border:1px solid ${colors.border};border-radius:${radius.md};
  background:${colors.white};color:${colors.textMuted};cursor:pointer;
  display:flex;align-items:center;justify-content:center;transition:${transition.fast};
  svg{font-size:16px!important}
  &:hover{border-color:${colors.danger};color:${colors.danger};background:#FEE2E2}
`;
const PayHist  = styled.div`
  overflow-x:auto;border:1px solid ${colors.border};border-radius:${radius.md};
  table{width:100%;min-width:560px;border-collapse:collapse}
  th,td{padding:9px 12px;border-bottom:1px solid ${colors.border};font-size:12px;text-align:left}
  th{background:#F8FAFC;color:${colors.textMuted};font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
  td{color:${colors.textSecondary}}
  tbody tr:last-child td{border-bottom:0}
`;
const ErrMsg   = styled.p`margin:8px 0 0;font-size:12px;color:${colors.danger}`;
const OkMsg    = styled.p`margin:8px 0 0;font-size:12px;color:${colors.success}`;
const TogBtn   = styled.button`
  background:none;border:none;cursor:pointer;color:${colors.primary};font:600 12px ${font.family};
  display:flex;align-items:center;gap:3px;padding:0;svg{font-size:16px!important}
`;
/* ── setup panel ── */
const SetupCard = styled(Card)`padding:0;margin-bottom:24px;overflow:hidden`;
const SetupTab  = styled.button`
  padding:10px 18px;border:none;border-bottom:2px solid ${({$a})=>$a?colors.primary:'transparent'};
  background:transparent;cursor:pointer;font:${({$a})=>$a?'600':'400'} 13px ${font.family};
  color:${({$a})=>$a?colors.primary:colors.textSecondary};transition:${transition.fast};
  &:hover{color:${colors.primary}}
`;
const InfoBox  = styled.div`
  padding:10px 14px;background:${colors.primaryLight};border:1px solid #C7D2FE;
  border-radius:${radius.md};font-size:12px;color:${colors.primaryDark||colors.primary};
  line-height:1.55;margin-bottom:16px
`;
const WarnBox  = styled.div`
  padding:10px 14px;background:#FEF3C7;border:1px solid #FDE68A;
  border-radius:${radius.md};font-size:12px;color:#92400E;line-height:1.55;margin-bottom:16px
`;

/* ── helpers ── */
const money = (v) =>
  v==null ? '—' : `₹${Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtDate = (v) => {
  if(!v) return '—';
  const d=new Date(v);
  return isNaN(d)?'—':d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
};
const toInputDate = (v) => {
  if(!v) return '';
  const d=new Date(v);
  return isNaN(d)?'':d.toISOString().slice(0,10);
};
const PMODES = ['Cash','Online Transfer','Demand Draft','Cheque','UPI','Card','Other'];
const emptyPay = () => ({
  amount:'', paymentDate:toInputDate(new Date()),
  paymentMode:'Online Transfer', transactionId:'', receiptNumber:'', remarks:'',
});

/* ═══════════════════════════════════════════════════════════════════════════
   SetupPanel — create fee structures + generate assessments for any dept/sem
   ═══════════════════════════════════════════════════════════════════════════ */
function SetupPanel({ onAssessmentsGenerated }) {
  const [tab, setTab]           = useState('structures');
  const [structs, setStructs]   = useState([]);
  const [loadingS, setLoadingS] = useState(true);
  const [sErr, setSErr]         = useState('');

  /* structure form */
  const [sfAY,   setSfAY]   = useState(ACADEMIC_YEARS[ACADEMIC_YEARS.length-1]);
  const [sfDept, setSfDept] = useState(ADMIN_DEPARTMENTS[0]);
  const [sfSem,  setSfSem]  = useState('1');
  const [sfComps,setSfComps]= useState([{category:'Tuition Fee',amount:''}]);
  const [sfErr,  setSfErr]  = useState('');
  const [sfOk,   setSfOk]   = useState('');
  const [sfBusy, setSfBusy] = useState(false);

  /* generate form */
  const [gAY,   setGAY]   = useState(ACADEMIC_YEARS[ACADEMIC_YEARS.length-1]);
  const [gDept, setGDept] = useState(ADMIN_DEPARTMENTS[0]);
  const [gSem,  setGSem]  = useState('1');
  const [gMsg,  setGMsg]  = useState('');
  const [gErr,  setGErr]  = useState('');
  const [gBusy, setGBusy] = useState(false);

  const loadStructs = useCallback(() => {
    setLoadingS(true); setSErr('');
    axios.get('/api/admin/fees/structures')
      .then(({data}) => setStructs(Array.isArray(data?.result)?data.result:[]))
      .catch((e) => setSErr(e.response?.data?.message||'Unable to load structures.'))
      .finally(() => setLoadingS(false));
  }, []);
  useEffect(()=>{ loadStructs(); },[loadStructs]);

  const setComp = (i,f,v) =>
    setSfComps(prev=>prev.map((c,idx)=>idx===i?{...c,[f]:v}:c));

  const handleSaveStruct = async (e) => {
    e.preventDefault(); setSfErr(''); setSfOk(''); setSfBusy(true);
    const comps = sfComps.map(c=>({category:c.category.trim(),amount:Number(c.amount)}));
    try {
      await axios.post('/api/admin/fees/structures',{
        academicYear:sfAY, department:sfDept, semester:Number(sfSem), components:comps,
      });
      setSfOk('Fee structure saved.');
      setSfComps([{category:'Tuition Fee',amount:''}]);
      loadStructs();
    } catch(e2){ setSfErr(e2.response?.data?.message||'Unable to save structure.'); }
    finally { setSfBusy(false); }
  };

  const handleDeleteStruct = async (id) => {
    if(!window.confirm('Delete this fee structure?')) return;
    try { await axios.delete(`/api/admin/fees/structures/${id}`); loadStructs(); }
    catch(e){ setSErr(e.response?.data?.message||'Unable to delete.'); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault(); setGErr(''); setGMsg(''); setGBusy(true);
    try {
      const {data} = await axios.post('/api/admin/fees/assessments/generate',{
        academicYear:gAY, department:gDept, semester:Number(gSem),
      });
      setGMsg(data.message||'Done.');
      onAssessmentsGenerated();
    } catch(e2){ setGErr(e2.response?.data?.message||'Unable to generate assessments.'); }
    finally { setGBusy(false); }
  };

  return (
    <SetupCard>
      <div style={{display:'flex',borderBottom:`1px solid ${colors.border}`,padding:'0 20px'}}>
        <SetupTab $a={tab==='structures'} onClick={()=>setTab('structures')}>Fee Structures</SetupTab>
        <SetupTab $a={tab==='generate'}   onClick={()=>setTab('generate')}>Generate Assessments</SetupTab>
      </div>
      <div style={{padding:'20px'}}>

        {tab==='structures' && <>
          <InfoBox>
            Define fee components per department and semester. A structure must exist before assessments can be generated.
            Currently <strong>{loadingS?'…':structs.length}</strong> structure{structs.length!==1?'s':''} configured.
          </InfoBox>
          {sErr && <ErrMsg style={{marginBottom:10}}>{sErr}</ErrMsg>}

          {!loadingS && structs.length>0 && (
            <PayHist style={{marginBottom:20}}>
              <table>
                <thead><tr><th>AY</th><th>Dept</th><th>Sem</th><th>Total Fee</th><th>Components</th><th></th></tr></thead>
                <tbody>
                  {structs.map(s=>(
                    <tr key={s._id}>
                      <td>{s.academicYear}</td><td>{s.department}</td><td>Sem {s.semester}</td>
                      <td style={{fontWeight:600,color:colors.textPrimary}}>{money(s.totalFee)}</td>
                      <td>{(s.components||[]).map(c=>`${c.category}: ${money(c.amount)}`).join(' · ')}</td>
                      <td>
                        <ActionBtn type="button" onClick={()=>handleDeleteStruct(s._id)}
                          style={{color:colors.danger,borderColor:colors.danger}}>Delete</ActionBtn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PayHist>
          )}
          {!loadingS && structs.length===0 && (
            <p style={{fontSize:13,color:colors.textMuted,marginBottom:16}}>No fee structures configured yet.</p>
          )}

          <div style={{fontSize:12,fontWeight:700,color:colors.textPrimary,marginBottom:12}}>Add New Structure</div>
          <form onSubmit={handleSaveStruct}>
            <FormGrid style={{marginBottom:12}}>
              <Field>
                <Label>Academic Year</Label>
                <Select value={sfAY} onChange={e=>setSfAY(e.target.value)}>
                  {ACADEMIC_YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                </Select>
              </Field>
              <Field>
                <Label>Department</Label>
                <Select value={sfDept} onChange={e=>setSfDept(e.target.value)}>
                  {ADMIN_DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                </Select>
              </Field>
              <Field>
                <Label>Semester</Label>
                <Select value={sfSem} onChange={e=>setSfSem(e.target.value)}>
                  {ADMIN_SEMESTERS.map(s=><option key={s} value={s}>Semester {s}</option>)}
                </Select>
              </Field>
            </FormGrid>
            <div style={{fontSize:11,fontWeight:600,color:colors.textMuted,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Fee Components</div>
            {sfComps.map((c,i)=>(
              <CompRow key={i}>
                <Field>
                  {i===0&&<Label>Category</Label>}
                  <Input value={c.category} onChange={ev=>setComp(i,'category',ev.target.value)} placeholder="e.g. Tuition Fee" required />
                </Field>
                <Field>
                  {i===0&&<Label>Amount (₹)</Label>}
                  <Input type="number" min="0" step="0.01" value={c.amount} onChange={ev=>setComp(i,'amount',ev.target.value)} placeholder="0.00" required />
                </Field>
                <RemBtn type="button" onClick={()=>setSfComps(p=>p.filter((_,idx)=>idx!==i))}><Close /></RemBtn>
              </CompRow>
            ))}
            <Btn type="button" $variant="ghost" $sm onClick={()=>setSfComps(p=>[...p,{category:'',amount:''}])} style={{marginBottom:12}}>
              <Add />Add Component
            </Btn>
            {sfErr&&<ErrMsg>{sfErr}</ErrMsg>}
            {sfOk &&<OkMsg>{sfOk}</OkMsg>}
            <div style={{marginTop:10}}>
              <Btn type="submit" disabled={sfBusy}>{sfBusy?'Saving…':'Save Structure'}</Btn>
            </div>
          </form>
        </>}

        {tab==='generate' && <>
          <InfoBox>
            Select a department and semester that has a configured fee structure. All eligible students in that year will receive a fee assessment. Students who already have an assessment for that semester and academic year are skipped automatically.
          </InfoBox>
          <form onSubmit={handleGenerate}>
            <FormGrid style={{marginBottom:16}}>
              <Field>
                <Label>Academic Year</Label>
                <Select value={gAY} onChange={e=>setGAY(e.target.value)}>
                  {ACADEMIC_YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                </Select>
              </Field>
              <Field>
                <Label>Department</Label>
                <Select value={gDept} onChange={e=>setGDept(e.target.value)}>
                  {ADMIN_DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                </Select>
              </Field>
              <Field>
                <Label>Semester</Label>
                <Select value={gSem} onChange={e=>setGSem(e.target.value)}>
                  {ADMIN_SEMESTERS.map(s=><option key={s} value={s}>Semester {s}</option>)}
                </Select>
              </Field>
            </FormGrid>
            {gErr&&<ErrMsg style={{marginBottom:8}}>{gErr}</ErrMsg>}
            {gMsg&&<OkMsg style={{marginBottom:8}}>{gMsg}</OkMsg>}
            <Btn type="submit" disabled={gBusy}>{gBusy?'Generating…':'Generate Assessments'}</Btn>
          </form>
        </>}
      </div>
    </SetupCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   StudentFeeDrawer — slide-in panel showing one student's full fee detail
   ═══════════════════════════════════════════════════════════════════════════ */
function StudentFeeDrawer({ registrationNumber, onClose, onSaved }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');
  const [editRec, setEditRec] = useState(null);
  const [payRec,  setPayRec]  = useState(null);
  const [hist,    setHist]    = useState({});
  const [comps,   setComps]   = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saveErr, setSaveErr] = useState('');
  const [saveOk,  setSaveOk]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [payForm, setPayForm] = useState(emptyPay());
  const [payErr,  setPayErr]  = useState('');
  const [payOk,   setPayOk]   = useState('');
  const [paying,  setPaying]  = useState(false);

  const load = useCallback(()=>{
    setLoading(true); setErr('');
    axios.get(`/api/admin/fees/student/${encodeURIComponent(registrationNumber)}`)
      .then(({data:d})=>setData(d))
      .catch(e=>setErr(e.response?.data?.message||'Unable to load fee records.'))
      .finally(()=>setLoading(false));
  },[registrationNumber]);
  useEffect(()=>{ load(); },[load]);

  const openEdit = (rec) => {
    setEditRec(rec); setPayRec(null);
    setComps((rec.components||[]).map(c=>({category:c.category,amount:String(c.amount)})));
    setDueDate(toInputDate(rec.dueDate)); setRemarks(rec.remarks||'');
    setSaveErr(''); setSaveOk('');
  };
  const openPay = (rec) => {
    setPayRec(rec); setEditRec(null);
    setPayForm(emptyPay()); setPayErr(''); setPayOk('');
  };
  const closeEdit = ()=>{ setEditRec(null); setSaveErr(''); setSaveOk(''); };
  const closePay  = ()=>{ setPayRec(null);  setPayErr('');  setPayOk('');  };
  const setComp   = (i,f,v)=>setComps(p=>p.map((c,idx)=>idx===i?{...c,[f]:v}:c));

  const handleSave = async (e) => {
    e.preventDefault(); setSaveErr(''); setSaveOk(''); setSaving(true);
    try {
      await axios.put(`/api/admin/fees/${editRec._id}`,{
        components:comps.map(c=>({category:c.category.trim(),amount:Number(c.amount)})),
        dueDate:dueDate||'', remarks,
      });
      setSaveOk('Assessment saved.'); load(); onSaved(); setTimeout(closeEdit,1200);
    } catch(e2){ setSaveErr(e2.response?.data?.message||'Unable to save.'); }
    finally { setSaving(false); }
  };

  const handlePay = async (e) => {
    e.preventDefault(); setPayErr(''); setPayOk(''); setPaying(true);
    try {
      await axios.post(`/api/admin/fees/${payRec._id}/payments`,{
        amount:Number(payForm.amount), paymentDate:payForm.paymentDate,
        paymentMode:payForm.paymentMode, transactionId:payForm.transactionId,
        receiptNumber:payForm.receiptNumber, remarks:payForm.remarks,
      });
      setPayOk('Payment recorded.'); load(); onSaved(); setTimeout(closePay,1200);
    } catch(e2){ setPayErr(e2.response?.data?.message||'Unable to record payment.'); }
    finally { setPaying(false); }
  };

  const student = data?.student||{};
  const records = data?.result ||[];
  const summary = data?.summary||{};

  return (<>
    <Overlay onClick={onClose}/>
    <Drawer role="dialog" aria-modal="true">
      <DrawerHead>
        <div>
          <h2>{student.name||registrationNumber}</h2>
          <p>{student.registrationNumber} · {student.department} · Year {student.year} · Section {student.section}</p>
        </div>
        <CloseBtn onClick={onClose}><Close/></CloseBtn>
      </DrawerHead>

      <DrawerBody>
        {loading && <p style={{color:colors.textMuted,fontSize:13}}>Loading…</p>}
        {err     && <p style={{color:colors.danger,fontSize:13}}>{err}</p>}
        {!loading&&!err&&<>
          <Sec>
            <SecLabel>Fee Summary</SecLabel>
            <InfoGrid>
              <InfoTile><span>Total Assessed</span><strong>{money(summary.totalFees)}</strong></InfoTile>
              <InfoTile><span>Amount Paid</span><strong>{money(summary.feesPaid)}</strong></InfoTile>
              <InfoTile><span>Outstanding</span><strong>{money(summary.pendingFees)}</strong></InfoTile>
              <InfoTile><span>Assessed Terms</span><strong>{summary.assessedTerms??0}</strong></InfoTile>
            </InfoGrid>
          </Sec>

          {records.length===0&&<p style={{fontSize:13,color:colors.textMuted}}>No fee assessments found for this student.</p>}

          {records.map(rec=>{
            const paid    = rec.amountPaid??0;
            const balance = rec.balance??Math.max(0,rec.totalFee-paid);
            const status  = rec.paymentStatus||'Pending';
            const hOpen   = hist[rec._id];
            return (
              <Sec key={rec._id} style={{border:`1px solid ${colors.border}`,borderRadius:radius.lg,padding:'16px 18px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:12}}>
                  <div>
                    <span style={{fontWeight:700,fontSize:14,color:colors.textPrimary}}>{rec.academicYear} · Semester {rec.semester}</span>
                    <span style={{marginLeft:10}}><SBadge $s={status}>{status}</SBadge></span>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    {editRec?._id!==rec._id&&payRec?._id!==rec._id&&<>
                      <ActionBtn type="button" onClick={()=>openEdit(rec)}><Edit/>Edit</ActionBtn>
                      {balance>0&&<ActionBtn type="button" onClick={()=>openPay(rec)}><Payment/>Record Payment</ActionBtn>}
                    </>}
                  </div>
                </div>

                <InfoGrid style={{marginBottom:10}}>
                  <InfoTile><span>Total Fee</span><strong>{money(rec.totalFee)}</strong></InfoTile>
                  <InfoTile><span>Paid</span><strong>{money(paid)}</strong></InfoTile>
                  <InfoTile><span>Balance</span><strong>{money(balance)}</strong></InfoTile>
                  <InfoTile><span>Due Date</span><strong>{fmtDate(rec.dueDate)}</strong></InfoTile>
                </InfoGrid>

                {rec.components?.length>0&&(
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:colors.textMuted,marginBottom:6}}>Components</div>
                    {rec.components.map((c,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,color:colors.textSecondary,padding:'3px 0',borderBottom:`1px solid ${colors.border}`}}>
                        <span>{c.category}</span><span style={{fontWeight:600,color:colors.textPrimary}}>{money(c.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {rec.remarks&&<p style={{fontSize:12,color:colors.textMuted,margin:'6px 0 0'}}>Remarks: {rec.remarks}</p>}

                {editRec?._id===rec._id&&(()=>{
                  const liveTotal = comps.reduce((s,c)=>s+Number(c.amount||0),0);
                  const alreadyPaid = rec.amountPaid??0;
                  const newBalance  = Math.max(0, liveTotal - alreadyPaid);
                  const belowPaid   = liveTotal < alreadyPaid;
                  return (
                  <form onSubmit={handleSave} style={{marginTop:14,padding:14,background:colors.bgPage,borderRadius:radius.md}}>
                    <div style={{fontSize:12,fontWeight:700,color:colors.textPrimary,marginBottom:4}}>Edit Assessment</div>
                    <p style={{fontSize:11,color:colors.textMuted,marginBottom:12,lineHeight:1.5}}>
                      Total Assessed = sum of all components below. Editing this record only affects this student — the shared fee structure is not changed.
                    </p>
                    {comps.map((c,i)=>(
                      <CompRow key={i}>
                        <Field>{i===0&&<Label>Category</Label>}<Input value={c.category} onChange={ev=>setComp(i,'category',ev.target.value)} placeholder="e.g. Tuition Fee" required/></Field>
                        <Field>{i===0&&<Label>Amount (₹)</Label>}<Input type="number" min="0" step="0.01" value={c.amount} onChange={ev=>setComp(i,'amount',ev.target.value)} required/></Field>
                        <RemBtn type="button" onClick={()=>setComps(p=>p.filter((_,idx)=>idx!==i))}><Close/></RemBtn>
                      </CompRow>
                    ))}
                    <Btn type="button" $variant="ghost" $sm onClick={()=>setComps(p=>[...p,{category:'',amount:''}])} style={{marginBottom:12}}><Add/>Add</Btn>

                    {/* live total preview */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',background:belowPaid?'#FEE2E2':'#EEF2FF',border:`1px solid ${belowPaid?colors.danger:'#C7D2FE'}`,borderRadius:radius.md,marginBottom:12}}>
                      <div style={{fontSize:12}}>
                        <span style={{color:colors.textMuted}}>New Total Assessed: </span>
                        <strong style={{color:belowPaid?colors.danger:colors.primary,fontSize:14}}>{money(liveTotal)}</strong>
                      </div>
                      <div style={{fontSize:12}}>
                        <span style={{color:colors.textMuted}}>Already Paid: </span>
                        <strong style={{color:colors.textPrimary}}>{money(alreadyPaid)}</strong>
                        <span style={{color:colors.textMuted,marginLeft:10}}>New Balance: </span>
                        <strong style={{color:belowPaid?colors.danger:colors.success}}>{belowPaid?'Cannot save — below paid amount':money(newBalance)}</strong>
                      </div>
                    </div>

                    <FormGrid>
                      <Field><Label>Due Date</Label><Input type="date" value={dueDate} onChange={ev=>setDueDate(ev.target.value)}/></Field>
                      <Field><Label>Remarks</Label><Input value={remarks} onChange={ev=>setRemarks(ev.target.value)} placeholder="Optional"/></Field>
                    </FormGrid>
                    {saveErr&&<ErrMsg>{saveErr}</ErrMsg>}
                    {saveOk &&<OkMsg>{saveOk}</OkMsg>}
                    <div style={{display:'flex',gap:8,marginTop:12}}>
                      <Btn type="submit" disabled={saving||belowPaid}>{saving?'Saving…':'Save Changes'}</Btn>
                      <Btn type="button" $variant="secondary" onClick={closeEdit}>Cancel</Btn>
                    </div>
                  </form>
                  );
                })()}

                {payRec?._id===rec._id&&(
                  <form onSubmit={handlePay} style={{marginTop:14,padding:14,background:'#F0FDF4',border:'1px solid #A7F3D0',borderRadius:radius.md}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#065F46',marginBottom:10}}>Record Payment · Balance: {money(balance)}</div>
                    <FormGrid>
                      <Field><Label>Amount (₹) *</Label><Input type="number" min="0.01" step="0.01" max={balance} value={payForm.amount} onChange={ev=>setPayForm(p=>({...p,amount:ev.target.value}))} required/></Field>
                      <Field><Label>Payment Date *</Label><Input type="date" value={payForm.paymentDate} onChange={ev=>setPayForm(p=>({...p,paymentDate:ev.target.value}))} required/></Field>
                      <Field><Label>Method *</Label>
                        <Select value={payForm.paymentMode} onChange={ev=>setPayForm(p=>({...p,paymentMode:ev.target.value}))} required>
                          {PMODES.map(m=><option key={m} value={m}>{m}</option>)}
                        </Select>
                      </Field>
                      <Field><Label>Transaction ID</Label><Input value={payForm.transactionId} onChange={ev=>setPayForm(p=>({...p,transactionId:ev.target.value}))} placeholder="Optional"/></Field>
                      <Field><Label>Receipt Number</Label><Input value={payForm.receiptNumber} onChange={ev=>setPayForm(p=>({...p,receiptNumber:ev.target.value}))} placeholder="Auto-generated if blank"/></Field>
                      <Field><Label>Remarks</Label><Input value={payForm.remarks} onChange={ev=>setPayForm(p=>({...p,remarks:ev.target.value}))} placeholder="Optional"/></Field>
                    </FormGrid>
                    {payErr&&<ErrMsg>{payErr}</ErrMsg>}
                    {payOk &&<OkMsg>{payOk}</OkMsg>}
                    <div style={{display:'flex',gap:8,marginTop:12}}>
                      <Btn type="submit" $variant="success" disabled={paying}>{paying?'Recording…':'Record Payment'}</Btn>
                      <Btn type="button" $variant="secondary" onClick={closePay}>Cancel</Btn>
                    </div>
                  </form>
                )}

                {rec.payments?.length>0&&(
                  <div style={{marginTop:12}}>
                    <TogBtn type="button" onClick={()=>setHist(p=>({...p,[rec._id]:!p[rec._id]}))}>
                      {hOpen?<ExpandLess/>:<ExpandMore/>}
                      {hOpen?'Hide':'Show'} payment history ({rec.payments.length})
                    </TogBtn>
                    {hOpen&&(
                      <PayHist style={{marginTop:8}}>
                        <table>
                          <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Transaction ID</th><th>Receipt</th><th>Remarks</th></tr></thead>
                          <tbody>
                            {rec.payments.map(p=>(
                              <tr key={p._id}>
                                <td>{fmtDate(p.paymentDate)}</td>
                                <td style={{fontWeight:600,color:colors.textPrimary}}>{money(p.amount)}</td>
                                <td>{p.paymentMode||'—'}</td>
                                <td>{p.transactionId||'—'}</td>
                                <td>{p.receiptNumber||'—'}</td>
                                <td>{p.remarks||'—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </PayHist>
                    )}
                  </div>
                )}
              </Sec>
            );
          })}
        </>}
      </DrawerBody>
      <DrawerFoot><Btn $variant="secondary" onClick={onClose}>Close</Btn></DrawerFoot>
    </Drawer>
  </>);
}

/* ═══════════════════════════════════════════════════════════════════════════
   AdminFees — main list page
   Filters are sent as query params to the backend so the backend does the
   filtering. The frontend does NOT re-filter the returned records (except for
   the live search box which is also sent to the backend).
   ═══════════════════════════════════════════════════════════════════════════ */
const AdminFees = () => {
  const admin    = useSelector(s => s.admin);
  const navigate = useNavigate();
  const { registrationNumber: paramReg } = useParams();

  const [records,    setRecords]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [loadError,  setLoadError]  = useState('');
  const [search,     setSearch]     = useState('');
  const [department, setDepartment] = useState('');
  const [semester,   setSemester]   = useState('');
  const [status,     setStatus]     = useState('');
  const [showSetup,  setShowSetup]  = useState(false);
  const [drawerReg,  setDrawerReg]  = useState(paramReg||null);

  /* Build query params from active filters and send to backend.
     The backend getFeeRecords already handles department, semester, status,
     and search correctly — we just need to pass them. */
  const loadList = useCallback(() => {
    if (!admin.isAuthenticated) return;
    setLoading(true);
    setLoadError('');
    const params = {};
    if (department)      params.department = department;
    if (semester)        params.semester   = semester;
    if (status)          params.status     = status;
    if (search.trim())   params.search     = search.trim();
    axios.get('/api/admin/fees', { params })
      .then(({ data }) => setRecords(Array.isArray(data?.result) ? data.result : []))
      .catch(e => {
        if (e.response?.status === 404) setRecords([]);
        else setLoadError(e.response?.data?.message || 'Unable to load fee records.');
      })
      .finally(() => setLoading(false));
  }, [admin.isAuthenticated, department, semester, status, search]);

  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => { if (paramReg) setDrawerReg(paramReg); }, [paramReg]);

  const openDrawer = (reg) => {
    setDrawerReg(reg);
    navigate(`/admin/fees/student/${encodeURIComponent(reg)}`, { replace: false });
  };
  const closeDrawer = () => {
    setDrawerReg(null);
    navigate('/admin/fees', { replace: false });
  };

  /* Stats are computed from the already-filtered records returned by the backend */
  const stats = useMemo(() => ({
    total:   records.length,
    paid:    records.filter(r => (r.paymentStatus||r.status) === 'Paid').length,
    pending: records.filter(r => (r.paymentStatus||r.status) === 'Pending').length,
    partial: records.filter(r => (r.paymentStatus||r.status) === 'Partially Paid').length,
  }), [records]);

  if (!admin.isAuthenticated) { navigate('/admin/login'); return null; }

  const hasFilters = department || semester || status || search.trim();

  return (
    <PageShell>
      <AdminNavbar />
      <Content>
        <PageHeader>
          <div>
            <PageTitle>Fee Management</PageTitle>
            <Subtitle>
              {records.length === 0 && !loading && !hasFilters
                ? 'No fee assessments exist yet. Use Fee Structures to configure fees, then Generate Assessments.'
                : 'View and manage student fee records across all departments. Click a row to edit or record a payment.'}
            </Subtitle>
          </div>
          <Btn $variant={showSetup ? 'secondary' : 'outline'} onClick={() => setShowSetup(p => !p)}>
            <Settings /> {showSetup ? 'Hide Setup' : 'Fee Setup'}
          </Btn>
        </PageHeader>

        {showSetup && <SetupPanel onAssessmentsGenerated={loadList} />}

        {/* Diagnostic notice when no records exist */}
        {!loading && records.length === 0 && !hasFilters && (
          <WarnBox style={{ marginBottom: 20 }}>
            <strong>No fee assessments found in the database.</strong> The database currently has 241 students across
            6 departments but 0 fee structures and only the 10 manually-created CSE Year 1 records.
            To populate fee records for other departments: open <strong>Fee Setup → Fee Structures</strong>,
            add a structure for each department/semester, then use <strong>Generate Assessments</strong>.
          </WarnBox>
        )}

        <StatGrid>
          <StatCard><span>Matching Records</span><strong>{loading ? '—' : stats.total}</strong></StatCard>
          <StatCard><span>Paid</span><strong>{loading ? '—' : stats.paid}</strong></StatCard>
          <StatCard><span>Pending</span><strong>{loading ? '—' : stats.pending}</strong></StatCard>
          <StatCard><span>Partially Paid</span><strong>{loading ? '—' : stats.partial}</strong></StatCard>
        </StatGrid>

        <FilterCard $pad="16px 18px">
          <Field>
            <Label htmlFor="fee-search">Search</Label>
            <SearchWrap>
              <Search />
              <Input id="fee-search" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="USN, name, or email" />
            </SearchWrap>
          </Field>
          <Field>
            <Label htmlFor="fee-dept">Department</Label>
            <Select id="fee-dept" value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">All departments</option>
              {ADMIN_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="fee-sem">Semester</Label>
            <Select id="fee-sem" value={semester} onChange={e => setSemester(e.target.value)}>
              <option value="">All semesters</option>
              {ADMIN_SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="fee-status">Status</Label>
            <Select id="fee-status" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {['Paid', 'Pending', 'Partially Paid'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Btn $variant="secondary"
            onClick={() => { setSearch(''); setDepartment(''); setSemester(''); setStatus(''); }}
            style={{ alignSelf: 'flex-end' }}>
            Reset
          </Btn>
        </FilterCard>

        <ResultsBar>
          <strong>{loading ? 'Loading…' : `${records.length} record${records.length !== 1 ? 's' : ''}`}</strong>
          {hasFilters && <span style={{ color: colors.primary, fontSize: 11 }}>Filters active</span>}
        </ResultsBar>

        {loadError ? (
          <Empty><h4>Unable to load fee records</h4><p>{loadError}</p></Empty>
        ) : loading ? (
          <Empty><p>Loading fee records…</p></Empty>
        ) : records.length === 0 && hasFilters ? (
          <Empty>
            <h4>No records match these filters</h4>
            <p>
              {department && `No fee assessments exist for ${department}`}
              {semester && ` Semester ${semester}`}
              {status && ` with status "${status}"`}.
              {' '}Use <strong>Fee Setup → Generate Assessments</strong> to create assessments for this selection.
            </p>
          </Empty>
        ) : records.length === 0 ? (
          <Empty>
            <h4>No fee records found</h4>
            <p>Use <strong>Fee Setup</strong> above to configure fee structures and generate assessments for students.</p>
          </Empty>
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>USN / Registration</th>
                  <th>Student Name</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Academic Year</th>
                  <th>Semester</th>
                  <th>Total Fee</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => {
                  const s   = record.student || record;
                  const reg = s.registrationNumber || '';
                  const bal = record.balance ?? Math.max(0, (record.totalFee||0) - (record.amountPaid||0));
                  return (
                    <tr key={record._id || reg} onClick={() => reg && openDrawer(reg)}>
                      <td><strong>{reg || '—'}</strong></td>
                      <td>{s.name || '—'}</td>
                      <td>{s.department || '—'}</td>
                      <td>{s.year ? `Year ${s.year}` : '—'}</td>
                      <td>{record.academicYear || '—'}</td>
                      <td>{record.semester ? `Sem ${record.semester}` : '—'}</td>
                      <td>{money(record.totalFee)}</td>
                      <td>{money(record.amountPaid)}</td>
                      <td>{money(bal)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <SBadge $s={record.paymentStatus || record.status}>
                          {record.paymentStatus || record.status || '—'}
                        </SBadge>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        {reg && (
                          <ActionBtn type="button" onClick={() => openDrawer(reg)}>
                            View Fees
                          </ActionBtn>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Content>

      {drawerReg && (
        <StudentFeeDrawer
          registrationNumber={drawerReg}
          onClose={closeDrawer}
          onSaved={loadList}
        />
      )}
    </PageShell>
  );
};

export default AdminFees;
