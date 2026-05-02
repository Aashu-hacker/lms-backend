// assets
import {
  IconUsers,
  IconBuilding,
  IconFileText,
  IconReport,
  IconClipboardCheck,
  IconMessageCircle,
  IconSend,
  IconEye,
  IconCheck,
  IconGitBranch
} from '@tabler/icons-react';

// constant
const icons = {
  IconUsers,
  IconBuilding,
  IconFileText,
  IconReport,
  IconClipboardCheck,
  IconMessageCircle,
  IconSend,
  IconEye,
  IconCheck,
  IconGitBranch
};

// ✅ Get logged-in user safely
const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

const user = getUser();
const role = user?.role?.toLowerCase() || null;

// ==============================|| ROLE BASED MENU ||============================== //

const pages = {
  id: 'pages',
  caption: 'Navigation',
  type: 'group',
  children: [
    // ================= ADMIN =================
    {
      id: 'admin-panel',
      title: 'Admin Panel',
      type: 'collapse',
      icon: icons.IconUsers,
      roles: ['admin'],
      children: [
        {
          id: 'users',
          title: 'Users Management',
          type: 'item',
          url: '/admin/users',
          icon: icons.IconUsers
        },
        {
          id: 'clients',
          title: 'Clients',
          type: 'item',
          url: '/admin/clients',
          icon: icons.IconBuilding
        },
        {
          id: 'templates',
          title: 'Report Templates',
          type: 'item',
          url: '/admin/templates',
          icon: icons.IconFileText
        },
        {
          id: 'report-types',
          title: 'Report Types',
          type: 'item',
          url: '/admin/report-types',
          icon: icons.IconReport
        }
      ]
    },

    // ================= CLIENT =================
    {
      id: 'client-panel',
      title: 'Client Panel',
      type: 'collapse',
      icon: icons.IconBuilding,
      roles: ['client'],
      children: [
        {
          id: 'client-reports',
          title: 'View Final Reports',
          type: 'item',
          url: '/client/reports',
          icon: icons.IconEye
        }
      ]
    },

    // ================= ANALYST =================
    {
      id: 'analyst-panel',
      title: 'Analyst Panel',
      type: 'collapse',
      icon: icons.IconFileText,
      roles: ['analyst'],
      children: [
        {
          id: 'create-report',
          title: 'Create Reports',
          type: 'item',
          url: '/analyst/create-report',
          icon: icons.IconFileText
        },
        {
          id: 'edit-report',
          title: 'Edit Reports',
          type: 'item',
          url: '/analyst/edit-report',
          icon: icons.IconClipboardCheck
        },
        {
          id: 'submit-report',
          title: 'Submit to Manager',
          type: 'item',
          url: '/analyst/submit-report',
          icon: icons.IconSend
        },
        {
          id: 'manager-comments',
          title: 'Manager Comments',
          type: 'item',
          url: '/analyst/comments',
          icon: icons.IconMessageCircle
        },
        {
          id: 'internal-version',
          title: 'Internal Versions',
          type: 'item',
          url: '/analyst/internal-versions',
          icon: icons.IconGitBranch
        }
      ]
    },

    // ================= MANAGER =================
    {
      id: 'manager-panel',
      title: 'Manager Panel',
      type: 'collapse',
      icon: icons.IconClipboardCheck,
      roles: ['manager'],
      children: [
        {
          id: 'submitted-reports',
          title: 'Submitted Reports',
          type: 'item',
          url: '/manager/submitted-reports',
          icon: icons.IconEye
        },
        {
          id: 'add-comments',
          title: 'Add Comments',
          type: 'item',
          url: '/manager/comments',
          icon: icons.IconMessageCircle
        },
        {
          id: 'approve-reports',
          title: 'Approve / Send Back',
          type: 'item',
          url: '/manager/approve-reports',
          icon: icons.IconCheck
        },
        {
          id: 'forward-client',
          title: 'Forward to Client',
          type: 'item',
          url: '/manager/forward-client',
          icon: icons.IconSend
        },
        {
          id: 'external-version',
          title: 'External Versions',
          type: 'item',
          url: '/manager/external-versions',
          icon: icons.IconGitBranch
        }
      ]
    }
  ]
};

// ================= FILTER ROLE BASED MENU =================
pages.children = pages.children.filter(
  (menu) => !menu.roles || menu.roles.includes(role)
);

export default pages;