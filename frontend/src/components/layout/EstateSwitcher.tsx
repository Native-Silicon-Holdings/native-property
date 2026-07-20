import { useState } from 'react';
import { Building2, ChevronDown, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEstate } from '../../contexts/EstateContext';

/**
 * Staff-only estate switcher. Lists every estate in the active organization and
 * navigates to the same module under the newly selected estate's slug.
 */
const EstateSwitcher = () => {
  const { estates, activeEstate, switchEstate, loading } = useEstate();
  const [open, setOpen] = useState(false);

  if (loading || estates.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-md border border-border text-sm font-medium text-foreground hover:bg-accent/10 transition-colors"
      >
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="max-w-[10rem] truncate">{activeEstate?.name || 'Select estate'}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-popover text-popover-foreground rounded-lg border border-border shadow-lg py-1 z-20 max-h-80 overflow-y-auto">
            <p className="px-3 py-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              Estates
            </p>
            {estates.map((estate) => (
              <button
                key={estate.id}
                onClick={() => {
                  switchEstate(estate.slug);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-accent/10 transition-colors ${
                  estate.id === activeEstate?.id ? 'text-accent font-medium' : 'text-foreground'
                }`}
              >
                <span className="truncate">{estate.name}</span>
              </button>
            ))}
            <div className="border-t border-border mt-1 pt-1">
              <Link
                to="/portfolio"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
              >
                <LayoutGrid className="h-4 w-4" />
                <span>View all in Portfolio</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EstateSwitcher;
