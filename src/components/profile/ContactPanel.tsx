'use client';

import { Mail, MapPin, Phone, Link as LinkIcon } from 'lucide-react';

// Inline SVG icons for social media (not available in lucide-react v1.14.0)
const InstagramIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const LinkedinIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
  </svg>
);
const TwitterIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);
const FacebookIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const YoutubeIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
  </svg>
);

interface ContactPanelProps {
  mobileNumber?: string;
  email?: string;
  location?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  whatsapp?: string;
  customLinkLabel?: string;
  customLinkUrl?: string;
  canViewContact: boolean;
}

export default function ContactPanel({
  mobileNumber, email, location, instagram, linkedin, twitter, facebook, youtube, whatsapp, customLinkLabel, customLinkUrl, canViewContact
}: ContactPanelProps) {

  const hasContactInfo = mobileNumber || email || location;
  const hasSocials = instagram || linkedin || twitter || facebook || youtube || whatsapp || customLinkUrl;

  return (
    <div className="space-y-4">
      {hasContactInfo && (
        <div className="space-y-2">
          <h4 className="text-xs text-white/40 uppercase tracking-wider">Contact</h4>
          <div className="space-y-2">
            {canViewContact && mobileNumber && (
              <a href={`tel:${mobileNumber}`} className="flex items-center gap-3 text-sm text-white/80 hover:text-[#41eec2] transition-colors" style={{ minHeight: 44 }}>
                <Phone size={16} className="text-[#41eec2]" />
                <span>{mobileNumber}</span>
              </a>
            )}
            {canViewContact && email && (
              <a href={`mailto:${email}`} className="flex items-center gap-3 text-sm text-white/80 hover:text-[#41eec2] transition-colors" style={{ minHeight: 44 }}>
                <Mail size={16} className="text-[#41eec2]" />
                <span>{email}</span>
              </a>
            )}
            {location && (
              <div className="flex items-center gap-3 text-sm text-white/80">
                <MapPin size={16} className="text-[#41eec2]" />
                <span>{location}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {!canViewContact && hasContactInfo && (
        <div className="p-3 glass rounded-xl text-white/30 text-xs">
          Contact information is only visible to family members with appropriate permissions.
        </div>
      )}

      {hasSocials && (
        <div className="space-y-2">
          <h4 className="text-xs text-white/40 uppercase tracking-wider">Social</h4>
          <div className="flex gap-3">
            {instagram && (
              <a href={`https://instagram.com/${instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#7B61FF]/20 transition-colors" style={{ minWidth: 44, minHeight: 44 }}>
                <InstagramIcon size={18} className="text-white/60" />
              </a>
            )}
            {linkedin && (
              <a href={linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#7B61FF]/20 transition-colors" style={{ minWidth: 44, minHeight: 44 }}>
                <LinkedinIcon size={18} className="text-white/60" />
              </a>
            )}
            {twitter && (
              <a href={`https://twitter.com/${twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#7B61FF]/20 transition-colors" style={{ minWidth: 44, minHeight: 44 }}>
                <TwitterIcon size={18} className="text-white/60" />
              </a>
            )}
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#41eec2]/20 transition-colors" style={{ minWidth: 44, minHeight: 44 }}>
                <Phone size={18} className="text-white/60" />
              </a>
            )}
            {facebook && (
              <a href={facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#7B61FF]/20 transition-colors" style={{ minWidth: 44, minHeight: 44 }}>
                <FacebookIcon size={18} className="text-white/60" />
              </a>
            )}
            {youtube && (
              <a href={youtube.startsWith('http') ? youtube : `https://youtube.com/${youtube}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#EF5350]/20 transition-colors" style={{ minWidth: 44, minHeight: 44 }}>
                <YoutubeIcon size={18} className="text-white/60" />
              </a>
            )}
            {customLinkUrl && (
              <a href={customLinkUrl.startsWith('http') ? customLinkUrl : `https://${customLinkUrl}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#41eec2]/20 transition-colors" style={{ minWidth: 44, minHeight: 44 }}>
                <LinkIcon size={18} className="text-white/60" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
