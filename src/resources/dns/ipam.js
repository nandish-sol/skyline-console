export const PROVIDER_TYPES = {
  infoblox: 'Infoblox DDI',
  powerdns: 'PowerDNS',
  msdns: 'Microsoft DNS',
};

export const PROVIDER_TYPE_OPTIONS = Object.keys(PROVIDER_TYPES).map((k) => ({
  value: k,
  label: PROVIDER_TYPES[k],
}));

export const CONNECTION_STATUS = {
  active: 'Active',
  error: 'Error',
  unknown: 'Unknown',
};

export const CONNECTION_STATUS_COLORS = {
  active: 'green',
  error: 'red',
  unknown: 'default',
};

export const POOL_STATUS = {
  draft: 'Draft',
  applied: 'Applied',
};

export const PROVIDER_CAPABILITIES = {
  infoblox: { ipam: true, conflicts: true, gridMembers: true, reserve: true },
  powerdns: { ipam: false, conflicts: false, gridMembers: true, reserve: false },
  msdns: { ipam: false, conflicts: false, gridMembers: true, reserve: false },
};

export const API_URL_PLACEHOLDERS = {
  infoblox: 'https://infoblox-gm-ip/wapi/v2.12/',
  powerdns: 'http://powerdns-ip:8081',
  msdns: 'dns://dns-server-ip',
};

export const PASSWORD_LABELS = {
  infoblox: 'Password',
  powerdns: 'API Key',
  msdns: 'N/A (DNS protocol)',
};
