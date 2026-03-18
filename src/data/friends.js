/**
 * Mock friend data for the prototype.
 * In production this would come from auth + a friends API.
 */
export const MOCK_FRIENDS = [
  { id: 'me',   name: 'You',  color: '#4ecdc4', online: true,  isMe: true },
  { id: 'luna', name: 'Luna', color: '#e85d75', online: true,  isMe: false },
  { id: 'kai',  name: 'Kai',  color: '#e8a838', online: true,  isMe: false },
  { id: 'nova', name: 'Nova', color: '#7c5cbf', online: true,  isMe: false },
  { id: 'rex',  name: 'Rex',  color: '#5c8cbf', online: false, isMe: false },
  { id: 'sage', name: 'Sage', color: '#5ce878', online: false, isMe: false },
];
