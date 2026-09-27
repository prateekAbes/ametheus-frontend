"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Scale,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  RefreshCw,
  Table as TableIcon,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  Shield,
  Layers,
  ChevronRight,
  List,
} from "lucide-react";
import {
  getRegulations,
  createRegulation,
  updateRegulation,
  deleteRegulation,
  reorderRegulations,
  getRegulationTables,
  createRegulationTable,
  updateRegulationTable,
  deleteRegulationTable,
  GameRegulation,
  GameRegulationCreatePayload,
  RegulationTable,
  RegulationTableCreatePayload,
} from "@/lib/api/regulations";

export default function AdminRegulationsManager() {
  const [activeTab, setActiveTab] = useState<"regulations" | "tables">("regulations");

  // Regulations state
  const [regulations, setRegulations] = useState<GameRegulation[]>([]);
  const [isLoadingRegs, setIsLoadingRegs] = useState(true);
  const [editingReg, setEditingReg] = useState<GameRegulation | null>(null);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // Regulation Form state
  const [regForm, setRegForm] = useState<GameRegulationCreatePayload>({
    game_name: "",
    chapter_code: "",
    title: "",
    format: "",
    server: "",
    map_pool: [],
    rules: [],
    is_active: true,
  });
  const [mapPoolInput, setMapPoolInput] = useState("");
  const [rulesInput, setRulesInput] = useState("");

  // Tables state
  const [tables, setTables] = useState<RegulationTable[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [editingTable, setEditingTable] = useState<RegulationTable | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  // Table Builder Form state
  const [tableForm, setTableForm] = useState<RegulationTableCreatePayload>({
    title: "",
    description: "",
    columns: ["Game", "Chapter Code", "Format", "Server / Region", "Key Regulation"],
    rows: [["", "", "", "", ""]],
    is_active: true,
  });
  const [newColumnName, setNewColumnName] = useState("");

  // Action feedback message
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchAllData = useCallback(async () => {
    setIsLoadingRegs(true);
    setIsLoadingTables(true);
    try {
      const [regsData, tablesData] = await Promise.all([
        getRegulations(true),
        getRegulationTables(true),
      ]);
      setRegulations(Array.isArray(regsData) ? regsData : []);
      setTables(Array.isArray(tablesData) ? tablesData : []);
    } catch {
      showFeedback("error", "Failed to load regulations or tables from server.");
    } finally {
      setIsLoadingRegs(false);
      setIsLoadingTables(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // -------------------------------------------------------------
  // REGULATION ACTIONS
  // -------------------------------------------------------------

  const handleOpenAddReg = () => {
    setEditingReg(null);
    setRegForm({
      game_name: "",
      chapter_code: "",
      title: "",
      format: "",
      server: "",
      map_pool: [],
      rules: [],
      is_active: true,
    });
    setMapPoolInput("");
    setRulesInput("");
    setIsRegModalOpen(true);
  };

  const handleOpenEditReg = (reg: GameRegulation) => {
    setEditingReg(reg);
    setRegForm({
      game_name: reg.game_name,
      chapter_code: reg.chapter_code,
      title: reg.title,
      format: reg.format,
      server: reg.server,
      map_pool: reg.map_pool || [],
      rules: reg.rules || [],
      is_active: reg.is_active,
    });
    setMapPoolInput((reg.map_pool || []).join(", "));
    setRulesInput((reg.rules || []).join("\n"));
    setIsRegModalOpen(true);
  };

  const handleSaveReg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.game_name.trim() || !regForm.chapter_code.trim()) {
      showFeedback("error", "Game Name and Chapter Code are mandatory.");
      return;
    }

    const parsedMaps = mapPoolInput
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    const parsedRules = rulesInput
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    setIsSubmittingReg(true);
    try {
      const payload: GameRegulationCreatePayload = {
        ...regForm,
        map_pool: parsedMaps,
        rules: parsedRules,
        title: regForm.title.trim() || regForm.game_name.trim(),
      };

      if (editingReg) {
        await updateRegulation(editingReg.id, payload);
        showFeedback("success", `Updated regulation for ${payload.game_name} [${payload.chapter_code}].`);
      } else {
        await createRegulation(payload);
        showFeedback("success", `Added new regulation for ${payload.game_name} [${payload.chapter_code}].`);
      }

      setIsRegModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to save regulation.");
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const handleDeleteReg = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete regulations for "${name}"?`)) return;
    try {
      await deleteRegulation(id);
      showFeedback("success", `Deleted regulations for ${name}.`);
      fetchAllData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to delete regulation.");
    }
  };

  const handleMoveReg = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= regulations.length) return;

    const newOrder = [...regulations];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    setRegulations(newOrder);
    try {
      await reorderRegulations(newOrder.map((r) => r.id));
      showFeedback("success", "Regulations reordered successfully.");
    } catch {
      showFeedback("error", "Failed to persist new reorder to server.");
      fetchAllData();
    }
  };

  // -------------------------------------------------------------
  // DYNAMIC TABLE BUILDER ACTIONS
  // -------------------------------------------------------------

  const handleOpenAddTable = () => {
    setEditingTable(null);
    setTableForm({
      title: "New Discipline Regulation Table",
      description: "Custom table matrix of tournament regulations.",
      columns: ["Game", "Chapter Code", "Format", "Server / Region", "Key Regulation"],
      rows: [
        ["", "", "", "", ""],
      ],
      is_active: true,
    });
    setNewColumnName("");
    setIsTableModalOpen(true);
  };

  const handleOpenEditTable = (tbl: RegulationTable) => {
    setEditingTable(tbl);
    setTableForm({
      title: tbl.title,
      description: tbl.description || "",
      columns: [...tbl.columns],
      rows: tbl.rows.map((r) => [...r]),
      is_active: tbl.is_active,
    });
    setNewColumnName("");
    setIsTableModalOpen(true);
  };

  const handleAddColumn = () => {
    const colName = newColumnName.trim();
    if (!colName) return;
    if (tableForm.columns.includes(colName)) {
      showFeedback("error", "Column name already exists in this table.");
      return;
    }

    const updatedCols = [...tableForm.columns, colName];
    const updatedRows = tableForm.rows.map((row) => [...row, ""]);
    setTableForm({ ...tableForm, columns: updatedCols, rows: updatedRows });
    setNewColumnName("");
  };

  const handleRemoveColumn = (colIdx: number) => {
    if (tableForm.columns.length <= 1) {
      showFeedback("error", "A table must have at least one column.");
      return;
    }
    const updatedCols = tableForm.columns.filter((_, idx) => idx !== colIdx);
    const updatedRows = tableForm.rows.map((row) => row.filter((_, idx) => idx !== colIdx));
    setTableForm({ ...tableForm, columns: updatedCols, rows: updatedRows });
  };

  const handleAddRow = () => {
    const emptyRow = new Array(tableForm.columns.length).fill("");
    setTableForm({ ...tableForm, rows: [...tableForm.rows, emptyRow] });
  };

  const handleRemoveRow = (rowIdx: number) => {
    if (tableForm.rows.length <= 1) {
      showFeedback("error", "A table must contain at least one row.");
      return;
    }
    const updatedRows = tableForm.rows.filter((_, idx) => idx !== rowIdx);
    setTableForm({ ...tableForm, rows: updatedRows });
  };

  const handleCellChange = (rowIdx: number, colIdx: number, val: string) => {
    const updatedRows = tableForm.rows.map((row, rI) => {
      if (rI !== rowIdx) return row;
      const newRow = [...row];
      newRow[colIdx] = val;
      return newRow;
    });
    setTableForm({ ...tableForm, rows: updatedRows });
  };

  const handleMoveRow = (rowIdx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? rowIdx - 1 : rowIdx + 1;
    if (targetIdx < 0 || targetIdx >= tableForm.rows.length) return;
    const updatedRows = [...tableForm.rows];
    const [moved] = updatedRows.splice(rowIdx, 1);
    updatedRows.splice(targetIdx, 0, moved);
    setTableForm({ ...tableForm, rows: updatedRows });
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableForm.title.trim()) {
      showFeedback("error", "Table Title is required.");
      return;
    }
    if (tableForm.columns.length === 0) {
      showFeedback("error", "At least one column is required.");
      return;
    }

    setIsSubmittingTable(true);
    try {
      if (editingTable) {
        await updateRegulationTable(editingTable.id, tableForm);
        showFeedback("success", `Updated table "${tableForm.title}".`);
      } else {
        await createRegulationTable(tableForm);
        showFeedback("success", `Created new table "${tableForm.title}".`);
      }
      setIsTableModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to save table.");
    } finally {
      setIsSubmittingTable(false);
    }
  };

  const handleDeleteTable = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete table "${title}"?`)) return;
    try {
      await deleteRegulationTable(id);
      showFeedback("success", `Deleted table "${title}".`);
      fetchAllData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to delete table.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation */}
      <div className="bg-[#111622] border border-[#242C3D] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#E56A10] font-bold tracking-wider mb-1">
            <Scale className="w-4 h-4" /> TOURNAMENT RULEBOOK &amp; DISCIPLINE ENGINE
          </div>
          <h2 className="text-2xl font-bold font-headline text-white uppercase">
            Game Discipline Regulations &amp; Dynamic Tables
          </h2>
          <p className="text-xs text-[#94A3B8] font-mono mt-1 max-w-2xl leading-relaxed">
            Manage sanctioned game regulations, chapter codes, map pools, anti-cheat mandates, and dynamic matrix tables published to the public /rules page.
          </p>
        </div>

        {/* View Switcher & Add Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="bg-[#0B0E16] border border-[#242C3D] p-1 rounded-lg flex items-center">
            <button
              onClick={() => setActiveTab("regulations")}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "regulations"
                  ? "bg-[#E56A10] text-white shadow-xs"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" /> Regulations ({regulations.length})
            </button>
            <button
              onClick={() => setActiveTab("tables")}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "tables"
                  ? "bg-[#E56A10] text-white shadow-xs"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Tables ({tables.length})
            </button>
          </div>

          {activeTab === "regulations" ? (
            <button
              onClick={handleOpenAddReg}
              className="px-4 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white rounded-lg text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Game Regulation
            </button>
          ) : (
            <button
              onClick={handleOpenAddTable}
              className="px-4 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white rounded-lg text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Dynamic Table
            </button>
          )}

          <button
            onClick={fetchAllData}
            title="Refresh from server"
            className="p-2 bg-[#161B26] hover:bg-[#20283C] border border-[#242C3D] text-[#94A3B8] hover:text-white rounded-lg cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingRegs || isLoadingTables ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-mono animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
              : "bg-red-950/80 border-red-500 text-red-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* TAB 1: GAME DISCIPLINE REGULATIONS */}
      {/* --------------------------------------------------------- */}
      {activeTab === "regulations" && (
        <div className="bg-[#111622] border border-[#242C3D] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#242C3D] flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#94A3B8] tracking-wider">
              Configured Game Disciplines ({regulations.length})
            </span>
            <span className="text-[11px] font-mono text-[#64748B]">
              Reorder controls determine tab appearance on the public /rules page
            </span>
          </div>

          {isLoadingRegs ? (
            <div className="p-12 text-center text-slate-500 font-mono text-xs animate-pulse">
              Loading discipline regulations from database...
            </div>
          ) : regulations.length > 0 ? (
            <div className="divide-y divide-[#242C3D]">
              {regulations.map((reg, idx) => (
                <div
                  key={reg.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#161B26]/50 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-2 py-0.5 bg-[#E56A10]/15 border border-[#E56A10]/40 text-[#E56A10] font-mono text-xs font-extrabold rounded">
                        {reg.chapter_code}
                      </span>
                      <h3 className="font-headline font-bold text-base text-white">
                        {reg.game_name}
                      </h3>
                      {!reg.is_active && (
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-mono rounded">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-[#94A3B8] flex flex-wrap items-center gap-3">
                      <span><strong>Format:</strong> {reg.format}</span>
                      <span>•</span>
                      <span><strong>Server:</strong> {reg.server}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {(reg.map_pool || []).map((m) => (
                        <span
                          key={m}
                          className="px-2 py-0.5 bg-[#0B0E16] border border-[#242C3D] rounded text-[11px] font-mono text-[#CBD5E1]"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions & Reorder */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-[#0B0E16] border border-[#242C3D] rounded-lg">
                      <button
                        onClick={() => handleMoveReg(idx, "up")}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1.5 text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveReg(idx, "down")}
                        disabled={idx === regulations.length - 1}
                        title="Move Down"
                        className="p-1.5 text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border-l border-[#242C3D]"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleOpenEditReg(reg)}
                      className="px-3 py-1.5 bg-[#161B26] hover:bg-[#20283C] text-[#CBD5E1] hover:text-white border border-[#242C3D] rounded-lg text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>

                    <button
                      onClick={() => handleDeleteReg(reg.id, reg.game_name)}
                      className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 text-rose-400 rounded-lg cursor-pointer transition-colors"
                      title="Delete Regulation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-[#64748B] font-mono text-xs">
              No game discipline regulations found. Click &quot;Add Game Regulation&quot; to create one.
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* TAB 2: DYNAMIC TABLE BUILDER */}
      {/* --------------------------------------------------------- */}
      {activeTab === "tables" && (
        <div className="space-y-6">
          {isLoadingTables ? (
            <div className="p-12 text-center text-slate-500 font-mono text-xs animate-pulse bg-[#111622] rounded-2xl border border-[#242C3D]">
              Loading dynamic regulation tables...
            </div>
          ) : tables.length > 0 ? (
            tables.map((tbl) => (
              <div
                key={tbl.id}
                className="bg-[#111622] border border-[#242C3D] rounded-2xl overflow-hidden shadow-xs space-y-4 p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#242C3D]">
                  <div>
                    <h3 className="font-headline font-bold text-lg text-white uppercase">
                      {tbl.title}
                    </h3>
                    {tbl.description && (
                      <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                        {tbl.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenEditTable(tbl)}
                      className="px-3.5 py-1.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white rounded-lg text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Table Grid
                    </button>
                    <button
                      onClick={() => handleDeleteTable(tbl.id, tbl.title)}
                      className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 text-rose-400 rounded-lg cursor-pointer transition-colors"
                      title="Delete Table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Table Preview Grid */}
                <div className="overflow-x-auto border border-[#242C3D] rounded-xl bg-[#0B0E16]">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="bg-[#161B26] border-b border-[#242C3D] text-[#E56A10]">
                        {tbl.columns.map((c, idx) => (
                          <th key={idx} className="py-2.5 px-4 font-bold uppercase tracking-wider">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#242C3D] text-slate-300">
                      {tbl.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#161B26]/30">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-2.5 px-4 font-sans text-xs">
                              {cIdx === 1 ? (
                                <span className="px-2 py-0.5 bg-[#E56A10]/10 border border-[#E56A10]/30 text-[#E56A10] font-mono font-bold rounded text-[11px]">
                                  {cell}
                                </span>
                              ) : (
                                cell || <span className="text-[#64748B] italic">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-[#64748B] font-mono text-xs bg-[#111622] rounded-2xl border border-[#242C3D]">
              No dynamic regulation tables found. Click &quot;Add Dynamic Table&quot; to configure one.
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* MODAL 1: ADD / EDIT GAME REGULATION */}
      {/* --------------------------------------------------------- */}
      {isRegModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121622] border border-[#242C3D] rounded-2xl max-w-2xl w-full p-6 space-y-6 text-white max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#242C3D]">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#E56A10]" />
                <h3 className="text-xl font-headline font-bold uppercase text-white">
                  {editingReg ? `Edit ${editingReg.game_name} Regulations` : "Add Game Regulation"}
                </h3>
              </div>
              <button
                onClick={() => setIsRegModalOpen(false)}
                className="text-[#94A3B8] hover:text-white text-lg font-mono px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReg} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Game Name */}
                <div>
                  <label className="block text-[#94A3B8] uppercase font-bold mb-1">
                    Game Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.game_name}
                    onChange={(e) => setRegForm({ ...regForm, game_name: e.target.value })}
                    placeholder="e.g. Apex Legends, Rocket League"
                    className="w-full px-3.5 py-2.5 bg-[#0B0E16] border border-[#242C3D] rounded-lg text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                {/* Chapter Code */}
                <div>
                  <label className="block text-[#94A3B8] uppercase font-bold mb-1">
                    Dynamic Chapter Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.chapter_code}
                    onChange={(e) => setRegForm({ ...regForm, chapter_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. APL-01, RL-01, BGMI-02"
                    className="w-full px-3.5 py-2.5 bg-[#0B0E16] border border-[#242C3D] rounded-lg text-[#E56A10] font-bold focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-[#94A3B8] uppercase font-bold mb-1">
                    Full Section Heading / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.title}
                    onChange={(e) => setRegForm({ ...regForm, title: e.target.value })}
                    placeholder="e.g. Apex Legends (Trios Battle Royale Qualifiers)"
                    className="w-full px-3.5 py-2.5 bg-[#0B0E16] border border-[#242C3D] rounded-lg text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                {/* Format */}
                <div>
                  <label className="block text-[#94A3B8] uppercase font-bold mb-1">
                    Format Specification *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.format}
                    onChange={(e) => setRegForm({ ...regForm, format: e.target.value })}
                    placeholder="e.g. 5v5 Single Elimination | BO1"
                    className="w-full px-3.5 py-2.5 bg-[#0B0E16] border border-[#242C3D] rounded-lg text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                {/* Server Region */}
                <div>
                  <label className="block text-[#94A3B8] uppercase font-bold mb-1">
                    Server / Matchmaking Region *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.server}
                    onChange={(e) => setRegForm({ ...regForm, server: e.target.value })}
                    placeholder="e.g. AWS Mumbai (ap-south-1) 128T"
                    className="w-full px-3.5 py-2.5 bg-[#0B0E16] border border-[#242C3D] rounded-lg text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                {/* Map Pool */}
                <div className="sm:col-span-2">
                  <label className="block text-[#94A3B8] uppercase font-bold mb-1">
                    Map Pool (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={mapPoolInput}
                    onChange={(e) => setMapPoolInput(e.target.value)}
                    placeholder="e.g. Ascent, Haven, Bind, Split, Sunset, Lotus"
                    className="w-full px-3.5 py-2.5 bg-[#0B0E16] border border-[#242C3D] rounded-lg text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                {/* Rules List */}
                <div className="sm:col-span-2">
                  <label className="block text-[#94A3B8] uppercase font-bold mb-1">
                    Discipline Rules &amp; Mandates (One per line)
                  </label>
                  <textarea
                    rows={6}
                    value={rulesInput}
                    onChange={(e) => setRulesInput(e.target.value)}
                    placeholder="Roster Size: Exactly 5 active players...&#10;Anti-Cheat: Riot Vanguard must be running...&#10;Overtime: Win by 2 rounds..."
                    className="w-full px-3.5 py-2.5 bg-[#0B0E16] border border-[#242C3D] rounded-lg text-white focus:outline-none focus:border-[#E56A10] leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#242C3D]">
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="px-4 py-2 bg-[#161B26] hover:bg-[#20283C] text-slate-300 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] disabled:bg-slate-700 text-white rounded-lg text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  {isSubmittingReg ? "Saving..." : "Save Regulation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* MODAL 2: DYNAMIC TABLE BUILDER */}
      {/* --------------------------------------------------------- */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121622] border border-[#242C3D] rounded-2xl max-w-4xl w-full p-6 space-y-6 text-white max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#242C3D]">
              <div className="flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-[#E56A10]" />
                <h3 className="text-xl font-headline font-bold uppercase text-white">
                  {editingTable ? `Edit Table: ${editingTable.title}` : "Dynamic Regulation Table Builder"}
                </h3>
              </div>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="text-[#94A3B8] hover:text-white text-lg font-mono px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-6 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#94A3B8] uppercase font-bold mb-1">
                    Table Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={tableForm.title}
                    onChange={(e) => setTableForm({ ...tableForm, title: e.target.value })}
                    placeholder="e.g. Game Discipline Regulations Master Matrix"
                    className="w-full px-3.5 py-2.5 bg-[#0B0E16] border border-[#242C3D] rounded-lg text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                <div>
                  <label className="block text-[#94A3B8] uppercase font-bold mb-1">
                    Table Subtitle / Description
                  </label>
                  <input
                    type="text"
                    value={tableForm.description || ""}
                    onChange={(e) => setTableForm({ ...tableForm, description: e.target.value })}
                    placeholder="e.g. Standardized cross-discipline competitive rules."
                    className="w-full px-3.5 py-2.5 bg-[#0B0E16] border border-[#242C3D] rounded-lg text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
              </div>

              {/* Column Management */}
              <div className="p-4 bg-[#0B0E16] border border-[#242C3D] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="uppercase text-[#E56A10] font-bold">
                    1. Table Columns ({tableForm.columns.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      placeholder="New Column Name"
                      className="px-3 py-1 bg-[#161B26] border border-[#242C3D] rounded text-white text-xs font-mono focus:outline-none focus:border-[#E56A10]"
                    />
                    <button
                      type="button"
                      onClick={handleAddColumn}
                      className="px-3 py-1 bg-[#E56A10] hover:bg-[#C95B0A] text-white rounded text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
                    >
                      + Add Column
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {tableForm.columns.map((col, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#161B26] border border-[#242C3D] rounded-lg text-xs font-mono text-slate-200"
                    >
                      <span>{col}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveColumn(idx)}
                        title="Remove Column"
                        className="text-[#94A3B8] hover:text-rose-400 cursor-pointer ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row Grid Editing */}
              <div className="p-4 bg-[#0B0E16] border border-[#242C3D] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="uppercase text-[#E56A10] font-bold">
                    2. Table Rows &amp; Cells ({tableForm.rows.length} Rows)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-3 py-1 bg-[#161B26] hover:bg-[#20283C] border border-[#242C3D] text-[#CBD5E1] rounded text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
                  >
                    + Add Row
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="bg-[#161B26] border-b border-[#242C3D] text-[#94A3B8]">
                        <th className="py-2 px-2 text-center w-12">#</th>
                        {tableForm.columns.map((c, idx) => (
                          <th key={idx} className="py-2 px-2 uppercase font-bold text-slate-300">
                            {c}
                          </th>
                        ))}
                        <th className="py-2 px-2 text-center w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#242C3D]">
                      {tableForm.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#161B26]/30">
                          <td className="py-2 px-2 text-center text-[#64748B] font-mono text-[11px]">
                            {rIdx + 1}
                          </td>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-1 px-1.5">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                placeholder={`Enter ${tableForm.columns[cIdx] || 'value'}...`}
                                className="w-full px-2 py-1.5 bg-[#121622] border border-[#242C3D] rounded text-white text-xs font-mono focus:outline-none focus:border-[#E56A10]"
                              />
                            </td>
                          ))}
                          <td className="py-2 px-2 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveRow(rIdx, "up")}
                                disabled={rIdx === 0}
                                title="Move Row Up"
                                className="p-1 text-[#94A3B8] hover:text-white disabled:opacity-20 cursor-pointer"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveRow(rIdx, "down")}
                                disabled={rIdx === tableForm.rows.length - 1}
                                title="Move Row Down"
                                className="p-1 text-[#94A3B8] hover:text-white disabled:opacity-20 cursor-pointer"
                              >
                                ▼
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(rIdx)}
                                title="Delete Row"
                                className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer ml-1"
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#242C3D]">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-4 py-2 bg-[#161B26] hover:bg-[#20283C] text-slate-300 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTable}
                  className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] disabled:bg-slate-700 text-white rounded-lg text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  {isSubmittingTable ? "Saving..." : "Save Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
