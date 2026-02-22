"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import { Search, User, X, Phone, Mail, Tag } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";

type ClientSearchPaletteProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

type Client = {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  telegram_id?: string;
  tags?: Array<{ id: number; name: string; color: string }>;
};

const overlayTransition: Transition = { duration: 0.24, ease: "easeOut" };

export function ClientSearchPalette({ isOpen: externalIsOpen, onClose }: ClientSearchPaletteProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  // Load clients when palette opens
  useEffect(() => {
    if (isOpen && clients.length === 0) {
      setLoading(true);
      axios
        .get("/app/clients", {
          headers: { Accept: "application/json" },
        })
        .then((response) => {
          // API returns paginated data, extract the data array
          const clientsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.data || [];
          setClients(clientsData);
        })
        .catch((error) => {
          console.error("Failed to load clients:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  // Keyboard shortcut (Cmd+K or Ctrl+K) - only if not controlled externally
  useEffect(() => {
    if (externalIsOpen !== undefined) return; // Skip if controlled externally
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setInternalIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [externalIsOpen]);

  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        const searchLower = query.toLowerCase();
        return (
          client.name.toLowerCase().includes(searchLower) ||
          client.phone?.toLowerCase().includes(searchLower) ||
          client.email?.toLowerCase().includes(searchLower) ||
          client.tags?.some((tag) =>
            tag.name.toLowerCase().includes(searchLower)
          )
        );
      }),
    [query, clients]
  );

  const handleClientClick = (clientId: number) => {
    handleClose();
    setQuery("");
    router.visit(`/app/clients/${clientId}`);
  };

  const panelVariants: Variants = shouldReduceMotion
    ? {
        initial: { opacity: 0, y: 0, scale: 1 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 0, scale: 1 },
      }
    : {
        initial: { opacity: 0, scale: 0.96, y: 20, filter: "blur(6px)" },
        animate: {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.28, ease: [0.18, 0.89, 0.32, 1.12] },
        },
        exit: {
          opacity: 0,
          scale: 0.97,
          y: 12,
          filter: "blur(8px)",
          transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
        },
      };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              aria-hidden
              className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={overlayTransition}
              onClick={() => handleClose()}
            />

            <div className="fixed inset-0 z-[10000] flex items-start justify-center px-4 pt-24 sm:px-6">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Поиск клиентов"
                {...panelVariants}
                className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border/60 bg-card/90 backdrop-blur-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                >
                  <motion.div
                    className="absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-[150px]"
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : {
                            opacity: [0.25, 0.55, 0.25],
                            scale: [0.92, 1.08, 0.98],
                          }
                    }
                    transition={
                      shouldReduceMotion
                        ? undefined
                        : { duration: 8, repeat: Infinity, ease: "easeInOut" }
                    }
                  />
                  <motion.div
                    className="absolute bottom-[-30%] right-[-5%] h-72 w-72 rounded-full bg-emerald-400/20 blur-[160px]"
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : { opacity: [0.2, 0.5, 0.2], rotate: [0, 12, 0] }
                    }
                    transition={
                      shouldReduceMotion
                        ? undefined
                        : { duration: 10, repeat: Infinity, ease: "linear" }
                    }
                  />
                </div>

                <div className="relative flex items-center gap-3 px-5 py-4 bg-muted/30 rounded-t-3xl">
                  <Search className="h-5 w-5 text-primary" aria-hidden />
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Поиск клиентов по имени, телефону, email или тегам..."
                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground rounded-lg"
                    autoFocus
                  />
                  <motion.button
                    type="button"
                    onClick={() => handleClose()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    whileHover={
                      shouldReduceMotion
                        ? undefined
                        : { rotate: 90, scale: 1.05 }
                    }
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
                  >
                    <X className="h-4 w-4" aria-hidden />
                    <span className="sr-only">Закрыть</span>
                  </motion.button>
                </div>

                <motion.div
                  className="relative max-h-96 overflow-y-auto px-3 py-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {loading ? (
                    <div className="rounded-2xl border border-border/60 bg-white/5 p-6 text-center text-sm text-muted-foreground backdrop-blur">
                      Загрузка клиентов...
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="rounded-2xl border border-border/60 bg-white/5 p-6 text-center text-sm text-muted-foreground backdrop-blur">
                      {query
                        ? "Клиенты не найдены. Попробуйте другой запрос."
                        : "Нет клиентов"}
                    </div>
                  ) : (
                    <ul className="space-y-2" role="list">
                      {filteredClients.map((client, index) => {
                        return (
                          <motion.li
                            key={client.id}
                            initial={{
                              opacity: shouldReduceMotion ? 1 : 0,
                              y: shouldReduceMotion ? 0 : 12,
                            }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={
                              shouldReduceMotion
                                ? { duration: 0 }
                                : {
                                    delay: 0.04 * index,
                                    duration: 0.24,
                                    ease: "easeOut",
                                  }
                            }
                          >
                            <button
                              type="button"
                              onClick={() => handleClientClick(client.id)}
                              className="group flex w-full items-start justify-between rounded-2xl border border-transparent bg-white/5 px-4 py-4 text-left transition-colors duration-200 hover:border-border hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                            >
                              <div className="flex items-start gap-3 flex-1">
                                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border/40 bg-white/5 text-primary shadow-sm backdrop-blur">
                                  <User className="h-4 w-4" aria-hidden />
                                </span>
                                <div className="flex flex-col gap-1 min-w-0 flex-1">
                                  <span className="text-sm font-medium text-foreground">
                                    {client.name}
                                  </span>
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    {client.phone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {client.phone}
                                      </span>
                                    )}
                                    {client.email && (
                                      <span className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {client.email}
                                      </span>
                                    )}
                                  </div>
                                  {client.tags && client.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {client.tags.map((tag) => (
                                        <span
                                          key={tag.id}
                                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                                          style={{
                                            backgroundColor: `${tag.color}20`,
                                            color: tag.color,
                                          }}
                                        >
                                          <Tag className="h-2.5 w-2.5" />
                                          {tag.name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          </motion.li>
                        );
                      })}
                    </ul>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
