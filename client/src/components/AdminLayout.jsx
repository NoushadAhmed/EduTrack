import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import { colors } from '../styles/theme';

const Shell = styled.div`
  min-height: 100vh;
  background: ${colors.bgPage};
`;

const MainContent = styled.main`
  margin-left: ${({ $sidebarCollapsed, $mobile }) => {
    if ($mobile) return '0px';
    return $sidebarCollapsed ? '72px' : '240px';
  }};
  transition: margin-left 0.2s ease;
  min-height: calc(100vh - 64px);
  box-sizing: border-box;

  @media (max-width: 900px) {
    margin-left: 0;
  }
`;

const MobileBackdrop = styled.button`
  position: fixed;
  inset: 64px 0 0 0;
  border: 0;
  background: rgba(15, 23, 42, 0.25);
  z-index: 15;

  @media (min-width: 901px) {
    display: none;
  }
`;

const AdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900);

  useEffect(() => {
    const handleResize = () => {
      const nextMobile = window.innerWidth <= 900;
      setIsMobile(nextMobile);
      if (!nextMobile) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const closeMobileSidebar = () => setMobileOpen(false);

  return (
    <Shell>
      <AdminNavbar onMenuClick={() => setMobileOpen((open) => !open)} />
      <AdminSidebar
        collapsed={sidebarCollapsed && !isMobile}
        mobileOpen={mobileOpen}
        onClose={closeMobileSidebar}
        onToggleCollapse={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />
      {mobileOpen && <MobileBackdrop type="button" aria-label="Close sidebar" onClick={closeMobileSidebar} />}
      <MainContent $sidebarCollapsed={sidebarCollapsed && !isMobile} $mobile={isMobile}>{children}</MainContent>
    </Shell>
  );
};

export default AdminLayout;
