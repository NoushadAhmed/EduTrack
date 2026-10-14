import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAlert } from 'react-alert';
import styled from 'styled-components';
import AdminLayout from '../../components/AdminLayout';
import AdminBackButton from '../../components/AdminBackButton';
import { Avatar, Btn, Card, Input, Label, PageTitle, Subtitle } from '../../components/UI';
import { adminUpdateProfile } from '../../redux/actions/adminAction';
import { colors, font, radius } from '../../styles/theme';

const Page = styled.div`
  width: min(980px, 100%);
  margin: 0 auto;
  padding: 28px 24px 44px;

  @media (max-width: 600px) {
    padding: 20px 16px 32px;
  }
`;

const Heading = styled.div`
  margin-bottom: 22px;
`;

const HeadingTitle = styled(PageTitle)`
  margin-bottom: 6px;
`;

const ProfileCard = styled(Card)`
  padding: 28px;

  @media (max-width: 600px) {
    padding: 20px 16px;
  }
`;

const ProfileSummary = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-bottom: 24px;
  margin-bottom: 24px;
  border-bottom: 1px solid ${colors.border};
  text-align: center;
`;

const ProfileAvatar = styled(Avatar)`
  width: 88px;
  height: 88px;
  font-size: 32px;
`;

const ProfileName = styled.h2`
  max-width: 100%;
  margin: 0;
  overflow-wrap: anywhere;
  color: ${colors.textPrimary};
  font: 700 20px ${font.family};
`;

const RoleLabel = styled.span`
  padding: 5px 11px;
  border-radius: ${radius.full};
  background: ${colors.primaryLight};
  color: ${colors.primary};
  font: 700 11px ${font.family};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const Fields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 20px;

  @media (max-width: 620px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
`;

const Field = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
`;

const FieldLabel = styled(Label)`
  color: ${colors.textSecondary};
  font-weight: 600;
`;

const FieldError = styled.span`
  color: ${colors.danger};
  font: 12px ${font.family};
`;

const ScopeInfo = styled.div`
  margin-top: 20px;
  padding: 14px 16px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.primaryLight};
`;

const ScopeLabel = styled.div`
  margin-bottom: 4px;
  color: ${colors.primary};
  font: 700 10px ${font.family};
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

const ScopeValue = styled.div`
  color: ${colors.textPrimary};
  font: 700 14px ${font.family};
`;

const RegistrationInfo = styled.div`
  margin-top: 20px;
  padding: 14px 16px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.bgPage};
`;

const RegistrationLabel = styled.div`
  margin-bottom: 4px;
  color: ${colors.textMuted};
  font: 700 10px ${font.family};
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

const RegistrationValue = styled.div`
  color: ${colors.textPrimary};
  font: 600 13px ${font.family};
  overflow-wrap: anywhere;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;

  @media (max-width: 480px) {
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }
`;

const getProfileValues = (admin) => ({
  name: admin?.name || '',
  email: admin?.email || '',
  contactNumber: admin?.contactNumber == null ? '' : String(admin.contactNumber),
  joiningYear: admin?.joiningYear == null ? '' : String(admin.joiningYear),
});

const AdminProfile = () => {
  const dispatch = useDispatch();
  const alert = useAlert();
  const admin = useSelector((state) => state.admin?.admin || {});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState(() => getProfileValues(admin));
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!editing) setValues(getProfileValues(admin));
  }, [admin, editing]);

  const setField = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  };

  const cancelEditing = () => {
    setValues(getProfileValues(admin));
    setFieldErrors({});
    setEditing(false);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});

    try {
      await dispatch(adminUpdateProfile(values));
      setEditing(false);
      alert.success('Profile updated successfully.');
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData?.errors) setFieldErrors(responseData.errors);
      alert.error(
        err.response?.status === 401
          ? 'Your session has expired. Please log in again.'
          : responseData?.message || 'Unable to update profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl = admin?.avatar?.url;
  const initial = (admin?.name || 'A').trim().charAt(0).toUpperCase() || 'A';

  return (
    <AdminLayout>
      <Page>
        <AdminBackButton />
        <Heading>
          <HeadingTitle>Admin Profile</HeadingTitle>
          <Subtitle>View and update your administrator contact information.</Subtitle>
        </Heading>

        <ProfileCard as="form" noValidate onSubmit={saveProfile}>
          <ProfileSummary>
            <ProfileAvatar $size="88px">
              {avatarUrl ? <img src={avatarUrl} alt={`${admin?.name || 'Admin'} profile`} /> : initial}
            </ProfileAvatar>
            <ProfileName>{admin?.name || 'Administrator'}</ProfileName>
            <RoleLabel>Administrator</RoleLabel>
          </ProfileSummary>

          <Fields>
            <Field>
              <FieldLabel htmlFor="admin-profile-name">Name</FieldLabel>
              <Input
                id="admin-profile-name"
                name="name"
                autoComplete="name"
                value={values.name}
                onChange={setField}
                disabled={!editing || saving}
                required
                minLength={2}
                maxLength={30}
                aria-invalid={Boolean(fieldErrors.name)}
              />
              {fieldErrors.name && <FieldError>{fieldErrors.name}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="admin-profile-email">Email</FieldLabel>
              <Input
                id="admin-profile-email"
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={setField}
                disabled={!editing || saving}
                required
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email && <FieldError>{fieldErrors.email}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="admin-profile-contact">Mobile number</FieldLabel>
              <Input
                id="admin-profile-contact"
                name="contactNumber"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={values.contactNumber}
                onChange={setField}
                disabled={!editing || saving}
                required
                aria-invalid={Boolean(fieldErrors.contactNumber)}
              />
              {fieldErrors.contactNumber && <FieldError>{fieldErrors.contactNumber}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="admin-profile-joining-year">Joining year</FieldLabel>
              <Input
                id="admin-profile-joining-year"
                name="joiningYear"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={values.joiningYear}
                onChange={setField}
                disabled={!editing || saving}
                required
                aria-invalid={Boolean(fieldErrors.joiningYear)}
              />
              {fieldErrors.joiningYear && <FieldError>{fieldErrors.joiningYear}</FieldError>}
            </Field>
          </Fields>

          <ScopeInfo>
            <ScopeLabel>Scope</ScopeLabel>
            <ScopeValue>ALL DEPARTMENTS</ScopeValue>
          </ScopeInfo>

          <RegistrationInfo>
            <RegistrationLabel>Admin ID / Registration Number</RegistrationLabel>
            <RegistrationValue>{admin?.registrationNumber || 'Not available'}</RegistrationValue>
          </RegistrationInfo>

          <Actions>
            {editing ? (
              <>
                <Btn type="button" $variant="secondary" onClick={cancelEditing} disabled={saving}>
                  Cancel
                </Btn>
                <Btn type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Btn>
              </>
            ) : (
              <Btn type="button" onClick={() => setEditing(true)}>Edit Profile</Btn>
            )}
          </Actions>
        </ProfileCard>
      </Page>
    </AdminLayout>
  );
};

export default AdminProfile;
