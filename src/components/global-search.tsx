import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { MagnifyingGlass, FolderSimple, Users } from "@phosphor-icons/react";
import { useProjects, useClients } from "@/hooks/use-data";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const { data: clients = [] } = useClients();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback(
    (type: "project" | "client", id: string) => {
      setOpen(false);
      if (type === "project") {
        navigate({ to: "/projects", search: { detail: id } });
      } else {
        navigate({ to: "/clients", search: { detail: id } });
      }
    },
    [navigate],
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="relative h-8 w-full justify-start gap-2 text-[13px] text-muted-foreground font-normal"
        onClick={() => setOpen(true)}
      >
        <MagnifyingGlass className="h-3.5 w-3.5" weight="duotone" />
        <span className="hidden sm:inline">Search projects, clients…</span>
        <span className="sm:hidden">Search…</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search projects, clients…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {projects.length > 0 && (
            <CommandGroup heading="Projects">
              {projects.slice(0, 10).map((p) => (
                <CommandItem
                  key={p.id}
                  value={`project-${p.name}-${p.description ?? ""}`}
                  onSelect={() => handleSelect("project", p.id)}
                >
                  <FolderSimple className="mr-2 h-4 w-4 text-muted-foreground" weight="duotone" />
                  <span>{p.name}</span>
                  {p.description ? (
                    <span className="ml-2 truncate text-xs text-muted-foreground">
                      {p.description.slice(0, 50)}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {clients.length > 0 && (
            <CommandGroup heading="Clients">
              {clients.slice(0, 10).map((c) => (
                <CommandItem
                  key={c.id}
                  value={`client-${c.name}-${c.company_name ?? ""}`}
                  onSelect={() => handleSelect("client", c.id)}
                >
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{c.name}</span>
                  {c.company_name ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {c.company_name}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
