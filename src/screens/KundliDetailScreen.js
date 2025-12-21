import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    LayoutAnimation,
    Platform,
    UIManager,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import axios from "axios";
import Svg, { Path, Text as SvgText, G } from "react-native-svg";
import AstroTextRenderer from "../components/AstroTextRenderer"
// Enable LayoutAnimation on Android
if (Platform.OS === "android") {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

// ===========================================
// 1. CONFIGURATION
// ===========================================

const tabs = [
    { id: "general", title: "General Info", icon: "star-four-points" },
    { id: "charts", title: "Charts & Graphs", icon: "chart-arc" },
    { id: "planet", title: "Planetary Data", icon: "orbit" },
    { id: "dosha", title: "Doshas & Effects", icon: "alert-decagram" },
    { id: "dasha", title: "Dashas", icon: "zodiac-aquarius" },
    { id: "kp", title: "KP Astrology", icon: "telescope" },
    { id: "other", title: "Other Systems", icon: "book-open" },
];

// ===========================================
// 2. GENERIC HELPERS (for mixed API formats)
// ===========================================

/**
 * Normalizes common AstroTalk-style responses:
 * - Format A: { success, responseData:{ data:[...] } }
 * - Format B: { success, data:{...} }
 * - Format C: plain object/array
 * Optional innerKey: extracts from array items (e.g. astrodata)
 */
// ===========================================
// GENERIC VALUE RENDERER (fixes JSON in UI)
// ===========================================

const isPrimitive = (val) =>
    val === null ||
    val === undefined ||
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean";

const formatNumberIfLatLng = (key, value) => {
    if (
        typeof value === "number" &&
        ["latitude", "longitude", "lat", "lon"].includes(key)
    ) {
        return value.toFixed(2);
    }
    return value;
};

const renderValue = (value, depth = 0, parentKey = "", path = "") => {
    // Primitive
    if (isPrimitive(value)) {
        const formatted =
            typeof value === "number"
                ? formatNumberIfLatLng(parentKey, value)
                : value;

        return (
            <Text key={path} style={dataSectionStyles.valueText}>
                {String(formatted)}
            </Text>
        );
    }

    // Array
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return (
                <Text key={path} style={dataSectionStyles.valueText}>
                    —
                </Text>
            );
        }

        return (
            <View style={{ paddingLeft: depth * 8 }}>
                {value.map((item, idx) => {
                    const itemPath = `${path}[${idx}]`;

                    return (
                        <View key={itemPath} style={{ marginBottom: 4 }}>
                            {isPrimitive(item) ? (
                                <Text style={dataSectionStyles.valueText}>
                                    • {String(item)}
                                </Text>
                            ) : (
                                renderValue(item, depth + 1, parentKey, itemPath)
                            )}
                        </View>
                    );
                })}
            </View>
        );
    }

    // Object
    if (typeof value === "object" && value !== null) {
        return (
            <View style={{ paddingLeft: depth * 8 }}>
                {Object.entries(value).map(([k, v]) => {
                    const currentPath = path ? `${path}.${k}` : k;

                    return (
                        <View key={currentPath} style={{ marginBottom: 6 }}>
                            <Text style={dataSectionStyles.keyText}>
                                {k.replace(/_/g, " ").toUpperCase()}
                            </Text>
                            {renderValue(v, depth + 1, k, currentPath)}
                        </View>
                    );
                })}
            </View>
        );
    }

    return null;
};


const normalizeApiResponse = (root, { innerKey } = {}) => {
    if (!root) return null;

    let payload;

    if (root.responseData?.data != null) {
        payload = root.responseData.data;
    } else if (root.responseData != null) {
        payload = root.responseData;
    } else if (root.data != null) {
        payload = root.data;
    } else {
        payload = root;
    }

    if (Array.isArray(payload)) {
        if (innerKey) {
            const mapped = payload.map((item) =>
                item && typeof item === "object" && item[innerKey]
                    ? item[innerKey]
                    : item
            );
            return mapped.length === 1 ? mapped[0] : mapped;
        }
        return payload.length === 1 ? payload[0] : payload;
    }

    return payload;
};

// ===========================================
// 3. REUSABLE UI COMPONENTS
// ===========================================

const CollapsibleCard = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsOpen((prev) => !prev);
    };

    return (
        <View style={collapsibleStyles.card}>
            <TouchableOpacity onPress={toggle} style={collapsibleStyles.header}>
                <Text style={collapsibleStyles.title}>{title}</Text>
                <Icon
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="#4A2F1D"
                />
            </TouchableOpacity>
            {isOpen && <View style={collapsibleStyles.content}>{children}</View>}
        </View>
    );
};

// Generic data renderer with formatting
const DataSection = ({ title, data }) => {
    if (!data) {
        return (
            <CollapsibleCard title={title}>
                <Text style={dataSectionStyles.noData}>No data available</Text>
            </CollapsibleCard>
        );
    }

    // Array of objects -> table-style
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
        return (
            <CollapsibleCard title={title}>
                {data.map((row, rowIndex) => (
                    <View key={rowIndex} style={dataSectionStyles.tableRow}>
                        {Object.entries(row).map(([key, value]) => (
                            <View key={key} style={dataSectionStyles.tableCell}>
                                <Text style={dataSectionStyles.cellKey}>
                                    {key.replace(/_/g, " ").toUpperCase()}
                                </Text>
                                {renderValue(value)}
                            </View>
                        ))}
                    </View>
                ))}
            </CollapsibleCard>
        );
    }


    // Plain object -> key/value
    if (typeof data === "object") {
        return (
            <CollapsibleCard title={title}>
                {Object.entries(data).map(([key, value]) => (
                    <View key={key} style={dataSectionStyles.row}>
                        <Text style={dataSectionStyles.keyText}>
                            {key.replace(/_/g, " ").toUpperCase()}
                        </Text>
                        <View style={{ flex: 1 }}>
                            {renderValue(value)}
                        </View>
                    </View>
                ))}
            </CollapsibleCard>
        );
    }


    // Primitive
    return (
        <CollapsibleCard title={title}>
            <Text style={dataSectionStyles.valueText}>{String(data)}</Text>
        </CollapsibleCard>
    );
};
const planetColumns = [
    { key: "name", label: "PLANET", width: 100 },
    { key: "house", label: "HOUSE", width: 70 },
    { key: "rashi", label: "RASHI", width: 90 },
    { key: "degree", label: "DEGREE", width: 90 },
    { key: "isRetrograde", label: "RETRO", width: 80 },
    { key: "isCombust", label: "COMBUST", width: 90 },
    { key: "PlanetState", label: "STATE", width: 90 },
];


// Planet table with horizontal scroll
const PlanetTable = ({ title, rows }) => {
    if (!rows || !Array.isArray(rows) || rows.length === 0) return null;

    return (
        <CollapsibleCard title={title}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>

                    {/* HEADER */}
                    <View style={planetStyles.headerRow}>
                        {planetColumns.map(col => (
                            <View
                                key={col.key}
                                style={[planetStyles.cell, { width: col.width }]}
                            >
                                <Text style={planetStyles.headerText}>
                                    {col.label}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* ROWS */}
                    {rows.map((row, rowIndex) => (
                        <View key={rowIndex} style={planetStyles.row}>
                            {planetColumns.map(col => (
                                <View
                                    key={`${rowIndex}-${col.key}`}
                                    style={[planetStyles.cell, { width: col.width }]}
                                >
                                    {renderValue(row[col.key])}
                                </View>
                            ))}
                        </View>
                    ))}

                </View>
            </ScrollView>
        </CollapsibleCard>
    );
};


// Dosha card
const DoshaCard = ({ title, data }) => {
    if (!data) return null;

    // ---------- MANGAL DOSH ----------
    if (data.mangalDosha) {
        const d = data.mangalDosha;
        return (
            <CollapsibleCard title={title}>
                <Text style={doshaStyles.status}>
                    Type: {d.type || "—"} | Intensity: {d.intensity || "—"}
                </Text>
                {d.reason && <Text style={doshaStyles.desc}>{d.reason}</Text>}
                {d.info && <Text style={doshaStyles.desc}>{d.info}</Text>}
            </CollapsibleCard>
        );
    }

    // ---------- KAAL SARP DOSH ----------
    if (data.kaalsarpDosha) {
        const d = data.kaalsarpDosha;
        return (
            <CollapsibleCard title={title}>
                <Text style={doshaStyles.status}>
                    Status: {d.kalsharpdosh ? "Present" : "Not Present"}
                </Text>
                {d.type && <Text style={doshaStyles.desc}>Type: {d.type}</Text>}
                {d.info && <Text style={doshaStyles.desc}>{d.info}</Text>}
            </CollapsibleCard>
        );
    }

    // ---------- PITRA DOSH ----------
    if (Array.isArray(data.rina)) {
        return (
            <CollapsibleCard title={title}>
                {data.pitridosh !== undefined && (
                    <Text style={doshaStyles.status}>
                        Pitra Dosh: {data.pitridosh ? "Present" : "Not Present"}
                    </Text>
                )}

                {data.info && <Text style={doshaStyles.desc}>{data.info}</Text>}

                {data.rina.map((item, idx) => (
                    <View key={idx} style={{ marginBottom: 10 }}>
                        <Text style={doshaStyles.remTitle}>
                            {item.name} — {item.status ? "Active" : "Inactive"}
                        </Text>
                        <Text style={doshaStyles.desc}>{item.info}</Text>
                    </View>
                ))}
            </CollapsibleCard>
        );
    }

    // ---------- SADESATI ----------
    if (Array.isArray(data.sadesati)) {
        return (
            <CollapsibleCard title={title}>
                {data.info && <Text style={doshaStyles.desc}>{data.info}</Text>}

                {data.sadesati.map((p, idx) => (
                    <View key={idx} style={dashaStyles.row}>
                        <Text style={dashaStyles.planetText}>
                            {p.type} {p.phase ? `(${p.phase})` : ""}
                        </Text>
                        <Text style={dashaStyles.dateText}>
                            {p.startDate} → {p.endDate}
                        </Text>
                    </View>
                ))}
            </CollapsibleCard>
        );
    }

    // ---------- FALLBACK (future-proof) ----------
    return <DataSection title={title} data={data} />;
};


// Dasha table
const DashaTable = ({ title, data }) => {
    if (!data) return null;

    const raw = data.data || data;
    const list = Array.isArray(raw) ? raw : [];

    if (!list.length) {
        return <DataSection title={title} data={data} />;
    }

    return (
        <CollapsibleCard title={title}>
            {list.map((row, i) => (
                <View key={i} style={dashaStyles.row}>
                    <Text style={dashaStyles.planetText}>
                        {row.planet || row.dasha || row.name}
                    </Text>
                    <Text style={dashaStyles.dateText}>
                        {row.start_date || row.startDate || row.from}
                    </Text>
                    <Text style={dashaStyles.dateText}>
                        {row.end_date || row.endDate || row.to}
                    </Text>
                </View>
            ))}
        </CollapsibleCard>
    );
};
const RASHI_LABELS = [
    "Ar", "Ta", "Ge", "Cn", "Le", "Vi",
    "Li", "Sc", "Sg", "Cp", "Aq", "Pi"
];

const AshtakVargaTable = ({ title, data }) => {
    const list = data?.prastarakListData?.prastarakList;
    if (!Array.isArray(list) || list.length === 0) return null;

    return (
        <CollapsibleCard title={title}>
            {list.map((planetBlock, blockIndex) => (
                <View key={blockIndex} style={{ marginBottom: 16 }}>

                    {/* PLANET NAME */}
                    <Text style={{
                        fontWeight: "700",
                        fontSize: 14,
                        color: "#7F1D1D",
                        marginBottom: 6
                    }}>
                        {planetBlock.name} Ashtak Varga
                    </Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View>

                            {/* HEADER */}
                            <View style={ashtakStyles.headerRow}>
                                <View style={[ashtakStyles.cell, { width: 90 }]}>
                                    <Text style={ashtakStyles.headerText}>PLANET</Text>
                                </View>

                                {RASHI_LABELS.map(r => (
                                    <View key={r} style={[ashtakStyles.cell, { width: 50 }]}>
                                        <Text style={ashtakStyles.headerText}>{r}</Text>
                                    </View>
                                ))}

                                <View style={[ashtakStyles.cell, { width: 60 }]}>
                                    <Text style={ashtakStyles.headerText}>TOT</Text>
                                </View>
                            </View>

                            {/* ROWS */}
                            {planetBlock.prastaraks.map((row, rowIndex) => (
                                <View key={rowIndex} style={ashtakStyles.row}>
                                    <View style={[ashtakStyles.cell, { width: 90 }]}>
                                        <Text style={ashtakStyles.cellText}>{row.name}</Text>
                                    </View>

                                    {row.prastarak.map((val, i) => (
                                        <View
                                            key={i}
                                            style={[ashtakStyles.cell, { width: 50 }]}
                                        >
                                            <Text
                                                style={[
                                                    ashtakStyles.cellText,
                                                    val === 1 && ashtakStyles.activeCell
                                                ]}
                                            >
                                                {val}
                                            </Text>
                                        </View>
                                    ))}

                                    <View style={[ashtakStyles.cell, { width: 60 }]}>
                                        <Text style={ashtakStyles.totalText}>{row.total}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                </View>
            ))}
        </CollapsibleCard>
    );
};
const ashtakStyles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        backgroundColor: "#FEF3C7",
    },
    row: {
        flexDirection: "row",
        backgroundColor: "#FFF",
    },
    cell: {
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderWidth: 0.5,
        borderColor: "#E5E5E5",
        alignItems: "center",
        justifyContent: "center",
    },
    headerText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#7F1D1D",
    },
    cellText: {
        fontSize: 12,
        color: "#333",
    },
    activeCell: {
        fontWeight: "800",
        color: "#15803D",
    },
    totalText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#1E3A8A",
    },
});
const SarvashtakVargaTable = ({ title, data }) => {
    const list =
        data?.sarvashtakaListData?.sarvashtakaList?.[0]?.prastaraks;

    if (!Array.isArray(list) || list.length === 0) return null;

    return (
        <CollapsibleCard title={title}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>

                    {/* HEADER */}
                    <View style={sarvaStyles.headerRow}>
                        <View style={[sarvaStyles.cell, { width: 90 }]}>
                            <Text style={sarvaStyles.headerText}>PLANET</Text>
                        </View>

                        {RASHI_LABELS.map(r => (
                            <View key={r} style={[sarvaStyles.cell, { width: 50 }]}>
                                <Text style={sarvaStyles.headerText}>{r}</Text>
                            </View>
                        ))}

                        <View style={[sarvaStyles.cell, { width: 70 }]}>
                            <Text style={sarvaStyles.headerText}>TOTAL</Text>
                        </View>
                    </View>

                    {/* ROWS */}
                    {list.map((row, rowIndex) => (
                        <View key={rowIndex} style={sarvaStyles.row}>
                            <View style={[sarvaStyles.cell, { width: 90 }]}>
                                <Text style={sarvaStyles.planetText}>{row.name}</Text>
                            </View>

                            {row.sarvashtak.map((val, i) => (
                                <View key={i} style={[sarvaStyles.cell, { width: 50 }]}>
                                    <Text
                                        style={[
                                            sarvaStyles.valueText,
                                            val >= 5 && sarvaStyles.strong,
                                            val <= 2 && sarvaStyles.weak,
                                        ]}
                                    >
                                        {val}
                                    </Text>
                                </View>
                            ))}

                            <View style={[sarvaStyles.cell, { width: 70 }]}>
                                <Text style={sarvaStyles.totalText}>{row.total}</Text>
                            </View>
                        </View>
                    ))}

                </View>
            </ScrollView>
        </CollapsibleCard>
    );
};
const sarvaStyles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        backgroundColor: "#FEF3C7",
    },
    row: {
        flexDirection: "row",
        backgroundColor: "#FFF",
    },
    cell: {
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderWidth: 0.5,
        borderColor: "#E5E5E5",
        alignItems: "center",
        justifyContent: "center",
    },
    headerText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#7F1D1D",
    },
    planetText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#2C1810",
    },
    valueText: {
        fontSize: 12,
        color: "#333",
    },
    strong: {
        fontWeight: "800",
        color: "#166534", // green
    },
    weak: {
        color: "#B91C1C", // red
    },
    totalText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#1E3A8A",
    },
});
const getDashaTitle = (row) =>
    row.planet || row.yogini || row.rashi || "—";

const getStart = (row) =>
    row.startDate || row.start || "—";

const getEnd = (row) =>
    row.endDate || row.end || "—";
const FlatDashaTable = ({ title, list }) => {
    if (!Array.isArray(list) || list.length === 0) return null;

    return (
        <CollapsibleCard title={title}>
            {list.map((row, i) => (
                <View key={`${title}-${i}`} style={dashaStyles.row}>
                    <Text style={dashaStyles.planetText}>
                        {getDashaTitle(row)}
                    </Text>
                    <Text style={dashaStyles.dateText}>
                        {getStart(row)}
                    </Text>
                    <Text style={dashaStyles.dateText}>
                        {getEnd(row)}
                    </Text>
                </View>
            ))}
        </CollapsibleCard>
    );
};
const CharDashaTable = ({ title, list }) => {
    if (!Array.isArray(list) || list.length === 0) return null;

    return (
        <CollapsibleCard title={title}>
            {list.map((row, i) => (
                <CollapsibleCard
                    key={`char-${i}`}
                    title={`${row.rashi} (${row.duration} yrs)`}
                >
                    <Text style={dashaStyles.dateText}>
                        {row.start} → {row.end}
                    </Text>

                    {row.antarDasha?.map((a, idx) => (
                        <View key={idx} style={dashaStyles.subRow}>
                            <Text style={dashaStyles.subPlanet}>
                                {a.rashi}
                            </Text>
                            <Text style={dashaStyles.subDate}>
                                {a.start} → {a.end}
                            </Text>
                        </View>
                    ))}
                </CollapsibleCard>
            ))}
        </CollapsibleCard>
    );
};
const KP_PLANET_COLUMNS = [
    { key: "name", label: "PLANET", width: 90 },
    { key: "house", label: "HOUSE", width: 60 },
    { key: "rashi", label: "RASHI", width: 90 },
    { key: "degree", label: "DEGREE", width: 100 },
    { key: "nakshatra", label: "NAKSHATRA", width: 120 },
    { key: "subLord", label: "SUB LORD", width: 100 },
    { key: "isRetrograde", label: "RETRO", width: 70 },
    { key: "PlanetState", label: "STATE", width: 80 },
];
const KPPlanetTable = ({ data }) => {
    const rows = data?.planetData?.planetList;
    if (!Array.isArray(rows)) return null;

    return (
        <CollapsibleCard title="KP Planetary Positions">
            <ScrollView horizontal>
                <View>
                    <View style={planetStyles.headerRow}>
                        {KP_PLANET_COLUMNS.map(c => (
                            <Text key={c.key} style={[planetStyles.headerText, { width: c.width }]}>
                                {c.label}
                            </Text>
                        ))}
                    </View>

                    {rows.map((row, i) => (
                        <View key={row.name + i} style={planetStyles.row}>
                            {KP_PLANET_COLUMNS.map(c => (
                                <View key={c.key} style={{ width: c.width }}>
                                    {renderValue(row[c.key])}
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </CollapsibleCard>
    );
};
const KPCuspsTable = ({ data }) => {
    const rows = data?.cuspsData?.cuspsList;
    if (!Array.isArray(rows)) return null;

    return (
        <CollapsibleCard title="KP Cusps Details">
            {rows.map(c => (
                <View key={c.house} style={dashaStyles.row}>
                    <Text style={dashaStyles.planetText}>House {c.house}</Text>
                    <Text style={dashaStyles.dateText}>
                        {c.degree} • {c.rashi}
                    </Text>
                </View>
            ))}
        </CollapsibleCard>
    );
};
const PlanetSignificators = ({ data }) => {
    const rows = data?.planetSignificatorsData?.planetSignificators;
    if (!Array.isArray(rows)) return null;

    return (
        <CollapsibleCard title="Planet Significators">
            {rows.map((p, i) => (
                <View key={p.planet} style={{ marginBottom: 10 }}>
                    <Text style={doshaStyles.remTitle}>{p.planet}</Text>

                    {["Star", "Sub", "Sign", "Own"].map((label, idx) => (
                        <Text key={idx} style={dataSectionStyles.valueText}>
                            {label}: {p.significators[idx]?.join(", ") || "—"}
                        </Text>
                    ))}
                </View>
            ))}
        </CollapsibleCard>
    );
};
const KPRulingPlanets = ({ data }) => {
    const r = data?.rulingPlanetsData?.rulingPlanets;
    if (!r) return null;

    return (
        <CollapsibleCard title="Ruling Planets">
            {Object.entries(r).map(([k, v]) => (
                <Text key={k} style={doshaStyles.status}>
                    {k.replace(/_/g, " ").toUpperCase()}: {v}
                </Text>
            ))}
        </CollapsibleCard>
    );
};
const HouseSignificators = ({ data }) => {
    const rows = data?.houseSignificatorsData?.houseSignificators;
    if (!Array.isArray(rows)) return null;

    return (
        <CollapsibleCard title="House Significators">
            {rows.map(h => (
                <CollapsibleCard key={h.house} title={`House ${h.house}`}>
                    {["Star", "Sub", "Sign", "Own"].map((label, i) => (
                        <Text key={i} style={dataSectionStyles.valueText}>
                            {label}: {h.significators[i]?.join(", ") || "—"}
                        </Text>
                    ))}
                </CollapsibleCard>
            ))}
        </CollapsibleCard>
    );
};

const NumerologySection = ({ data }) => {
    const n = data?.core?.numerlogy;
    if (!n) return null;

    return (
        <CollapsibleCard title="Numerology">
            <View style={numerologyStyles.row}>
                <NumerologyCard label="Radical" value={n.radicalNumber} />
                <NumerologyCard label="Destiny" value={n.destinyNumber} />
                <NumerologyCard label="Name" value={n.nameNumber} />
            </View>

            <View style={{ marginTop: 12 }}>
                {Object.entries(n.details).map(([k, v]) => (
                    <View key={k} style={numerologyStyles.detailRow}>
                        <Text style={numerologyStyles.key}>
                            {k.replace(/([A-Z])/g, " $1").toUpperCase()}
                        </Text>
                        <Text style={numerologyStyles.value}>
                            {Array.isArray(v) ? v.join(", ") : String(v)}
                        </Text>
                    </View>
                ))}
            </View>
        </CollapsibleCard>
    );
};
const numerologyStyles = StyleSheet.create({
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    detailRow: {
        marginBottom: 6,
    },
    key: {
        fontSize: 12,
        fontWeight: "700",
        color: "#7F1D1D",
    },
    value: {
        fontSize: 13,
        color: "#333",
    },
});

const KarakaPlanetSection = ({ data }) => {
    const k = data?.gemini?.karakaPlanetData?.karakDetails;
    if (!k) return null;

    return (
        <CollapsibleCard title="Jaimini Karakas">
            <View style={{ marginBottom: 10 }}>
                <Text style={karakaStyles.lagna}>
                    Ascendant: {k.ascendant}
                </Text>
                <Text style={karakaStyles.sub}>
                    Pad Lagna: {k.pad_lagna} | Upapada: {k.up_pad_lagna}
                </Text>
                <Text style={karakaStyles.sub}>
                    Karamsha Lagna: {k.karamsha_lagna}
                </Text>
            </View>

            {k.karakaPlanetList.map(item => (
                <CollapsibleCard key={item.name} title={item.name}>
                    {Object.entries(item.planet).map(([key, value]) => (
                        <View key={key} style={karakaStyles.row}>
                            <Text style={karakaStyles.key}>
                                {key.replace(/_/g, " ").toUpperCase()}
                            </Text>
                            <Text style={karakaStyles.value}>
                                {String(value)}
                            </Text>
                        </View>
                    ))}
                </CollapsibleCard>
            ))}
        </CollapsibleCard>
    );
};
const karakaStyles = StyleSheet.create({
    lagna: {
        fontSize: 14,
        fontWeight: "700",
        color: "#7F1D1D",
    },
    sub: {
        fontSize: 12,
        color: "#555",
    },
    row: {
        marginBottom: 6,
    },
    key: {
        fontSize: 11,
        fontWeight: "700",
        color: "#7F1D1D",
    },
    value: {
        fontSize: 13,
        color: "#333",
    },
});

const PredictionBlock = ({ title, html }) => {
    if (!html || !html.trim()) return null;

    return (
        <CollapsibleCard title={title}>
            <AstroTextRenderer html={html} />
        </CollapsibleCard>
    );
};

const PredictionSection = ({ data }) => {
    if (!data) return null;

    return (
        <CollapsibleCard title="Predictions">
            {data.ascendant && (
                <PredictionBlock title="Ascendant" html={data.ascendant} />
            )}

            {data.sign && (
                <PredictionBlock title="Moon Sign" html={data.sign} />
            )}

            {data.planets?.map((p, i) => (
                <PredictionBlock
                    key={`planet-${i}`}
                    title={`Planet in House ${p.house}`}
                    html={p.prediction}
                />
            ))}

            {data.bhav?.map((b, i) => (
                <PredictionBlock
                    key={`bhav-${i}`}
                    title={b.name}
                    html={b.prediction}
                />
            ))}

            {data.nakshatra && (
                <PredictionBlock title="Nakshatra" html={data.nakshatra} />
            )}

            {data.dosha?.map((d, i) => (
                d.prediction ? (
                    <PredictionBlock
                        key={`dosha-${i}`}
                        title={d.name.toUpperCase()}
                        html={d.prediction}
                    />
                ) : null
            ))}
        </CollapsibleCard>
    );
};


const NumerologyCard = ({ label, value }) => (
    <View style={{
        width: "30%",
        padding: 10,
        borderRadius: 8,
        backgroundColor: "#F9EFE5",
        alignItems: "center"
    }}>
        <Text style={{ fontSize: 12, color: "#7F1D1D" }}>{label}</Text>
        <Text style={{ fontSize: 22, fontWeight: "bold" }}>{value}</Text>
    </View>
);


// ---------- Chart helpers ----------


const NORTH_INDIAN_PATHS = [
    "M10 10L175 10L92.5 87.5L10 10",
    "M175 10L340 10L257.5 87.5L175 10",
    "M92.5 87.5L10 165L10 10",
    "M92.5 87.5L175 165L257.5 87.5L175 10",
    "M257.5 87.5L340 165L340 10",
    "M92.5,87.5L175,165L92.5,242.5L10,165",
    "M257.5,87.5L340,165L257.5,242.5L175,165",
    "M92.5,242.5L10,320L10,165",
    "M175,165L257.5,242.5L175,320L92.5,242.5",
    "M92.5,242.5L175,320L10,320",
    "M257.5,242.5L340,320L175,320",
    "M340,165L340,320L257.5,242.5",
];

const NORTH_INDIAN_TEXT_POSITIONS = [
    { x: 175, y: 90 },
    { x: 92.5, y: 45 },
    { x: 45, y: 90 },
    { x: 90, y: 170 },
    { x: 45, y: 250 },
    { x: 92.5, y: 290 },
    { x: 175, y: 250 },
    { x: 257.5, y: 290 },
    { x: 305, y: 250 },
    { x: 260, y: 170 },
    { x: 305, y: 90 },
    { x: 257.5, y: 45 },
];
const reorderChartForNorthIndian = (chart) => {
    if (!Array.isArray(chart)) return [];

    // 1️⃣ Find Lagna sign
    const lagnaRashi =
        chart.find(h => h.ascendant === true)?.rashiIndex || 1;

    // 2️⃣ Create array indexed by display rashi
    const slotMap = {};

    chart.forEach(h => {
        const displayIndex =
            ((h.rashiIndex - lagnaRashi + 12) % 12); // 0 → 11

        slotMap[displayIndex] = h;
    });

    // 3️⃣ Return ordered array for SVG slots
    return Array.from({ length: 12 }, (_, i) => slotMap[i] || null);
};

const NorthIndianSvgChart = ({ data }) => {
    const chart =
        data?.chartData?.chart ||
        data?.data?.chartData?.chart ||
        data?.chart;

    if (!Array.isArray(chart)) return null;

    const orderedChart = reorderChartForNorthIndian(chart);

    return (
        <View style={{ alignItems: "center", height: 360 }}>
            <Svg width={350} height={350} viewBox="0 0 350 350">
                {/* Chart lines */}
                {NORTH_INDIAN_PATHS.map((d, i) => (
                    <Path
                        key={i}
                        d={d}
                        fill="none"
                        stroke="#980d0d"
                        strokeWidth={2}
                    />
                ))}

                {/* Signs + planets */}
                {orderedChart.map((signData, index) => {
                    if (!signData) return null;
                    const pos = NORTH_INDIAN_TEXT_POSITIONS[index];
                    if (!pos) return null;

                    return (
                        <G key={index}>
                            <SvgText
                                x={pos.x}
                                y={pos.y}
                                textAnchor="middle"
                                fontSize={11}
                                fontWeight="bold"
                                fill="#1F2937"
                            >
                                {signData.rashiIndex}
                            </SvgText>

                            {signData.rashi && (
                                <SvgText
                                    x={pos.x}
                                    y={pos.y + 12}
                                    textAnchor="middle"
                                    fontSize={9}
                                    fill="#6B7280"
                                >
                                    {signData.rashi}
                                </SvgText>
                            )}

                            {signData.planets?.map((planet, i) => (
                                <SvgText
                                    key={i}
                                    x={pos.x + i * 15 - 22}
                                    y={pos.y - 15}
                                    textAnchor="middle"
                                    fontSize={9}
                                    fontWeight="600"
                                    fill={planet.color || "#E15602"}
                                >
                                    {planet.name}
                                </SvgText>
                            ))}
                        </G>
                    );
                })}
            </Svg>
        </View>
    );
};





const ChartSection = ({ title, data }) => {
    if (!data) return null;

    const label = title
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/^\w/, c => c.toUpperCase());


    return (
        <CollapsibleCard title={`${label} Chart`}>
            <NorthIndianSvgChart data={data} />
        </CollapsibleCard>
    );
};


const TabButton = ({ tab, activeTab, onPress }) => (
    <TouchableOpacity
        style={[tabStyles.tab, activeTab === tab.id && tabStyles.activeTab]}
        onPress={() => onPress(tab.id)}
    >
        <Icon
            name={tab.icon}
            size={20}
            color={activeTab === tab.id ? "#FFF" : "#4A2F1D"}
            style={tabStyles.tabIcon}
        />
        <Text
            style={[
                tabStyles.tabText,
                activeTab === tab.id && tabStyles.activeTabText,
            ]}
        >
            {tab.title}
        </Text>
    </TouchableOpacity>
);

// ===========================================
// 4. MAIN COMPONENT
// ===========================================

const KundliDetailScreen = ({ route }) => {
    const { kundliId } = route.params;

    const [initialLoading, setInitialLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("general");

    const [dataLoading, setDataLoading] = useState(
        tabs.reduce((acc, tab) => ({ ...acc, [tab.id]: false }), {})
    );

    const [basic, setBasic] = useState(null);
    const [astroData, setAstroData] = useState(null);
    const [birthData, setBirthData] = useState(null);
    const [friendship, setFriendship] = useState(null);
    const [charts, setCharts] = useState(null);
    const [planetData, setPlanetData] = useState(null);
    const [dosha, setDosha] = useState(null);
    const [dasha, setDasha] = useState(null);
    const [kp, setKP] = useState(null);
    const [numerology, setNumerology] = useState(null); // { core, gemini }
    const [prediction, setPrediction] = useState(null);

    const reqBodyRef = useRef(null);
    // ---------- Basic + general tab ----------
    const fetchBasicDetails = async () => {
        try {
            const res = await axios.post(
                "https://api.acharyalavbhushan.com/api/kundli/get_kundli_basic_details",
                { kundliId },
                { headers: { "Content-Type": "application/json" } }
            );

            const d = res.data?.data;
            const p = res.data?.payload;

            if (!d || !p) {
                setInitialLoading(false);
                setDataLoading((prev) => ({ ...prev, general: false }));
                return;
            }

            const basicData = {
                name: d.name,
                place: d.place,
                gender: d.gender,
                day: p.day,
                month: p.month,
                year: p.year,
                hour: p.hour,
                min: p.min,
                latitude: p.lat,
                longitude: p.lon,
                timezone: p.tzone,
            };
            setBasic(basicData);

            const req = {
                name: d.name,
                day: String(p.day),
                month: String(p.month),
                year: String(p.year),
                hour: String(p.hour),
                min: String(p.min),
                latitude: String(p.lat),
                longitude: String(p.lon),
                timezone: "5.5",
                place: d.place,
                gender: d.gender,
            };
            reqBodyRef.current = req;

            const [astroRes, birthRes, friendRes, numerologyRes, predictionsRes] =
                await Promise.all([
                    axios.post(
                        "https://kundli2.astrosetalk.com/api/astro/get_astro_data",
                        req
                    ),
                    axios.post(
                        "https://kundli2.astrosetalk.com/api/astro/get_birth_data",
                        req
                    ),
                    axios.post(
                        "https://kundli2.astrosetalk.com/api/astro/get_friendship_data",
                        req
                    ),
                    axios.post(
                        "https://kundli2.astrosetalk.com/api/numerlogy/get_details",
                        req
                    ),
                    axios.post(
                        "https://kundli2.astrosetalk.com/api/prediction/get_prediction",
                        req
                    ),
                ]);
            // Astro data (you logged astrodata nested structure)
            const astroNorm = normalizeApiResponse(astroRes.data, {
                innerKey: "astrodata",
            });
            setAstroData(astroNorm);

            // Birth data (guess innerKey 'birthdata' if present)
            const birthNormRaw = normalizeApiResponse(birthRes.data, {
                innerKey: "birthdata",
            });
            setBirthData(birthNormRaw);

            // Friendship data (guess innerKey 'friendshipdata' or fallback)
            const friendNorm = normalizeApiResponse(friendRes.data, {
                innerKey: "friendshipdata",
            });
            setFriendship(friendNorm);

            // Numerology core
            const numerologyCore = normalizeApiResponse(numerologyRes.data);
            setNumerology({ core: numerologyCore });

            // Predictions
            const predictionNorm = normalizeApiResponse(predictionsRes.data);
            setPrediction(predictionNorm);

        } catch (err) {
            console.error("Error fetching basic/general details:", err);
        } finally {
            setInitialLoading(false);
            setDataLoading((prev) => ({ ...prev, general: false }));
        }
    };
    const normalizeBasicTab = ({ astroNorm, birthNormRaw }) => {
        if (!astroNorm || !birthNormRaw) return null;

        return [
            {
                title: "Birth Details",
                data: {
                    Name: birthNormRaw.name,
                    Date: `${birthNormRaw.day}-${birthNormRaw.month}-${birthNormRaw.year}`,
                    Time: `${birthNormRaw.hour}:${birthNormRaw.min}`,
                    Place: birthNormRaw.place,
                    Gender: birthNormRaw.gender,
                    Sunrise: birthNormRaw.sunrise,
                    Sunset: birthNormRaw.sunset,
                    Day: birthNormRaw.dayname,
                    Masa: birthNormRaw.masa,
                    "Vikram Samvat": birthNormRaw.vikramSamvat,
                    "Shaka Samvat": birthNormRaw.shakSamvat,
                    Ayanamsha: birthNormRaw.ayanamsha?.degree,
                    "Ayanamsha Type": birthNormRaw.ayanamsha?.ayanamsha_name,
                },
            },
            {
                title: "Astro Profile",
                data: {
                    Ascendant: astroNorm.ascendant,
                    "Moon Sign": astroNorm.sign,
                    "Sign Lord": astroNorm.signLord,
                    Nakshatra: astroNorm.naksahtra,
                    "Nakshatra Lord": astroNorm.nakshatraLord,
                    Charan: astroNorm.charan,
                    Varna: astroNorm.varna,
                    Vashya: astroNorm.vashya,
                    Yoni: astroNorm.yoni,
                    Gana: astroNorm.gana,
                    Nadi: astroNorm.nadi,
                    Tatva: astroNorm.tatva,
                    Paya: astroNorm.paya,
                    "Name Alphabet (Hindi)": astroNorm.nameAlphabetHindi,
                    "Name Alphabet (English)": astroNorm.nameAlphabetEnglish,
                },
            },
            {
                title: "Panchang at Birth",
                data: {
                    Tithi: astroNorm.tithi?.name,
                    "Tithi From": astroNorm.tithi?.startDateTime,
                    "Tithi To": astroNorm.tithi?.endDateTime,
                    Yog: astroNorm.yog?.name,
                    "Yog From": astroNorm.yog?.startDateTime,
                    "Yog To": astroNorm.yog?.endDateTime,
                    Karan: astroNorm.karan?.name,
                    Sunrise: astroNorm.sunrise,
                    Sunset: astroNorm.sunset,
                },
            },
        ];
    };

    const normalizePlanetaryData = (planetData) => {
        if (!planetData) return null;

        return {
            planets:
                planetData?.allPlanets?.planetData?.planetList || [],

            upgraha:
                planetData?.upgraha?.upgrahaData?.upgrahaList || [],

            dashamBhav:
                planetData?.dashamBhav?.dashamBhavData?.dashamBhavList || [],

            ashtakVarga:
                planetData?.ashtak?.prastarakListData?.prastarakList || [],

            sarvashtak:
                planetData?.sarvashtak?.sarvashtakaListData?.sarvashtakaList || [],
        };
    };

    // ---------- Tab-specific loaders ----------
    const fetchTabContent = useCallback(async (tabId) => {
        if (!reqBodyRef.current) return;

        setDataLoading((prev) => ({ ...prev, [tabId]: true }));
        const req = reqBodyRef.current;

        try {
            switch (tabId) {
                case "charts": {
                    const [
                        lagna,
                        navamansha,
                        chalit,
                        moonChart,
                        sunChart,
                        hora,
                        dreshkan,
                        dashmansha,
                        dwadash,
                        trisham,
                        shashtyamsha,
                    ] = await Promise.all([
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/chart/get_lagna_chart",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/chart/get_navamansha_chart",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/chart/get_chalit_chart",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/chart/get_moon_chart",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/chart/get_sun_chart",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/chart/get_hora_chart",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/chart/get_dreshkan_chart",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/chart/get_dashamansha_chart",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/chart/get_dwadashamansha_chart",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/chart/get_trishamansha_chart",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/chart/get_shashtymsha_chart",
                            req
                        ),
                    ]);

                    setCharts({
                        lagna: normalizeApiResponse(lagna.data),
                        navamansha: normalizeApiResponse(navamansha.data),
                        chalit: normalizeApiResponse(chalit.data),
                        moon: normalizeApiResponse(moonChart.data),
                        sun: normalizeApiResponse(sunChart.data),
                        hora: normalizeApiResponse(hora.data),
                        dreshkan: normalizeApiResponse(dreshkan.data),
                        dashmansha: normalizeApiResponse(dashmansha.data),
                        dwadash: normalizeApiResponse(dwadash.data),
                        trisham: normalizeApiResponse(trisham.data),
                        shashtyamsha: normalizeApiResponse(shashtyamsha.data),
                    });
                    break;
                }

                case "planet": {
                    const [allPlanets, allUpgraha, dashamBhav, ashtak, sarvashtak] =
                        await Promise.all([
                            axios.post(
                                "https://kundli2.astrosetalk.com/api/planet/get_all_planet_data",
                                req
                            ),
                            axios.post(
                                "https://kundli2.astrosetalk.com/api/planet/get_all_upgraha_data",
                                req
                            ),
                            axios.post(
                                "https://kundli2.astrosetalk.com/api/planet/get_dasham_bhav_madhya",
                                req
                            ),
                            axios.post(
                                "https://kundli2.astrosetalk.com/api/planet/get_ashtak_varga_data",
                                req
                            ),
                            axios.post(
                                "https://kundli2.astrosetalk.com/api/planet/get_sarvashtak_data",
                                req
                            ),
                        ]);

                    setPlanetData({
                        allPlanets: normalizeApiResponse(allPlanets.data),
                        upgraha: normalizeApiResponse(allUpgraha.data),
                        dashamBhav: normalizeApiResponse(dashamBhav.data),
                        ashtak: normalizeApiResponse(ashtak.data),
                        sarvashtak: normalizeApiResponse(sarvashtak.data),
                    });
                    break;
                }

                case "dosha": {
                    const [mangal, kalsharp, pitra, sadhesati] = await Promise.all([
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/dosha/mangal_dosh_analysis",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/dosha/kalsharp_dosh_analysis",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/dosha/pitra_dosh_analysis",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/dosha/sadhesati_analysis",
                            req
                        ),
                    ]);

                    setDosha({
                        mangal: normalizeApiResponse(mangal.data),
                        kalsharp: normalizeApiResponse(kalsharp.data),
                        pitra: normalizeApiResponse(pitra.data),
                        sadhesati: normalizeApiResponse(sadhesati.data),
                    });
                    break;
                }

                case "dasha": {
                    const [
                        vimDasha,
                        vimCurrent,
                        yogini,
                        yoginiCurrent,
                        charDasha,
                        charCurrent,
                    ] = await Promise.all([
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/dasha/get_vimshottary_maha_dasha",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/dasha/get_vimshottary_current_dasha",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/dasha/get_yogini_maha_dasha",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/dasha/get_yogini_current_dasha",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/gemini/get_char_dasha_data",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/gemini/get_current_char_dasha_data",
                            req
                        ),
                    ]);

                    setDasha({
                        vimshottari: normalizeApiResponse(vimDasha.data),
                        vimCurrent: normalizeApiResponse(vimCurrent.data),
                        yogini: normalizeApiResponse(yogini.data),
                        yoginiCurrent: normalizeApiResponse(yoginiCurrent.data),
                        char: normalizeApiResponse(charDasha.data),
                        charCurrent: normalizeApiResponse(charCurrent.data),
                    });
                    break;
                }

                case "kp": {
                    const [
                        kpBirth,
                        kpCusps,
                        kpBirthChart,
                        kpPlanets,
                        kpCuspsData,
                        kpSignificators,
                        kpRuling,
                        houseSignificators,
                    ] = await Promise.all([
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/kp/kp_birth_data",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/kp/get_cusps_chart",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/kp/get_birth_chart",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/kp/get_all_planet_data",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/kp/get_cusps_data",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/kp/get_planet_significators",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/kp/get_ruling_planets",
                            req
                        ),
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/kp/get_house_significators",
                            req
                        ),
                    ]);

                    setKP({
                        birth: normalizeApiResponse(kpBirth.data),
                        cuspsChart: normalizeApiResponse(kpCusps.data),
                        birthChart: normalizeApiResponse(kpBirthChart.data),
                        planets: normalizeApiResponse(kpPlanets.data),
                        cuspsData: normalizeApiResponse(kpCuspsData.data),
                        significators: normalizeApiResponse(kpSignificators.data),
                        ruling: normalizeApiResponse(kpRuling.data),
                        houseSign: normalizeApiResponse(houseSignificators.data),
                    });
                    break;
                }

                case "other": {
                    const [gemini] = await Promise.all([
                        axios.post(
                            "https://kundli2.astrosetalk.com/api/gemini/get_gemini_data",
                            req
                        ),
                    ]);
                    const geminiData = normalizeApiResponse(gemini.data);
                    setNumerology((prev) => ({
                        ...(prev || {}),
                        gemini: geminiData,
                    }));
                    break;
                }

                default:
                    break;
            }
        } catch (err) {
            console.error(`Error fetching data for tab ${tabId}:`, err);
        } finally {
            setDataLoading((prev) => ({ ...prev, [tabId]: false }));
        }
    }, []);

    // ---------- Initial load ----------
    useEffect(() => {
        setDataLoading((prev) => ({ ...prev, general: true }));
        fetchBasicDetails();
    }, [kundliId]);

    // ---------- Lazy tab loading ----------
    useEffect(() => {
        const isDataLoaded = (tabId) => {
            switch (tabId) {
                case "general":
                    return astroData !== null;
                case "charts":
                    return charts !== null;
                case "planet":
                    return planetData !== null;
                case "dosha":
                    return dosha !== null;
                case "dasha":
                    return dasha !== null;
                case "kp":
                    return kp !== null;
                case "other":
                    return numerology !== null && numerology.gemini !== undefined;
                default:
                    return true;
            }
        };

        if (!initialLoading && !isDataLoaded(activeTab) && !dataLoading[activeTab]) {
            fetchTabContent(activeTab);
        }
    }, [
        activeTab,
        initialLoading,
        fetchTabContent,
        astroData,
        charts,
        planetData,
        dosha,
        dasha,
        kp,
        numerology,
        dataLoading,
    ]);

    const renderTabContent = useMemo(() => {
        if (dataLoading[activeTab]) {
            return (
                <View style={styles.tabLoader}>
                    <ActivityIndicator size="large" color="#7F1D1D" />
                    <Text style={styles.loadingText}>
                        Fetching {tabs.find((t) => t.id === activeTab).title} data...
                    </Text>
                </View>
            );
        }

        switch (activeTab) {
            case "general": {
                const sections = normalizeBasicTab({
                    astroNorm: astroData,
                    birthNormRaw: birthData,
                });

                if (!sections) return null;

                return (
                    <>
                        {sections.map((section, index) => (
                            <DataSection
                                key={index}
                                title={section.title}
                                data={section.data}
                            />
                        ))}
                    </>
                );
            }


            case "charts":
                if (!charts) return null;
                return (
                    <>
                        {Object.entries(charts).map(([key, data]) => (
                            <ChartSection key={key} title={key} data={data} />
                        ))}
                    </>
                );

            case "planet": {
                if (!planetData) return null;

                const normalized = normalizePlanetaryData(planetData);

                return (
                    <>
                        {/* 🌍 Planet Positions */}
                        <PlanetTable
                            title="Planet Positions"
                            rows={normalized.planets}
                        />

                        {/* ☄️ Upgraha */}
                        <PlanetTable
                            title="Upgraha"
                            rows={normalized.upgraha}
                        />

                        {/* 🏠 Dasham Bhav Madhya */}
                        <DataSection
                            title="Dasham Bhav Madhya"
                            data={normalized.dashamBhav}
                        />

                        {/* 🔢 Ashtak Varga */}
                        <AshtakVargaTable
                            title="Ashtak Varga (Prastarak)"
                            data={planetData?.ashtak}
                        />


                        {/* 📊 Sarvashtak Varga */}
                        <SarvashtakVargaTable
                            title="Sarvashtak Varga"
                            data={planetData?.sarvashtak}
                        />

                    </>
                );
            }

            case "dosha":
                if (!dosha) return null;
                return (
                    <>
                        <DoshaCard title="Mangal Dosh" data={dosha?.mangal} />
                        <DoshaCard title="Kalsharp Dosh" data={dosha?.kalsharp} />
                        <DoshaCard title="Pitra Dosh" data={dosha?.pitra} />
                        <DoshaCard title="Sadhesati Analysis" data={dosha?.sadhesati} />
                    </>
                );

            case "dasha":
                if (!dasha) return null;
                return (
                    <>
                        <FlatDashaTable
                            title="Vimshottari Maha Dasha"
                            list={dasha?.vimshottari?.vimshottaryMahaDashaData?.vimshottaryMahaDashaList}
                        />

                        <FlatDashaTable
                            title="Current Vimshottari Dasha"
                            list={dasha?.vimCurrent?.vimshottaryCurrentDashaData?.vimshottaryCurrentDashaList}
                        />

                        <FlatDashaTable
                            title="Yogini Maha Dasha"
                            list={dasha?.yogini?.yoginiMahaDashaData?.yoginiMahaDashaList}
                        />

                        <FlatDashaTable
                            title="Current Yogini Dasha"
                            list={dasha?.yoginiCurrent?.yoginiCurrentDashaData?.yoginiCurrentDashaList}
                        />
                        <CharDashaTable
                            title="Char Dasha"
                            list={dasha?.char?.charDashaData?.charDashaList}
                        />

                        <FlatDashaTable
                            title="Current Char Dasha"
                            list={dasha?.charCurrent?.charCurrentDashaData?.currentDashaList}
                        />

                    </>
                );

            case "kp":
                if (!kp) return null;
                return (
                    <>
                        <DataSection title="KP Birth Details" data={kp?.birth?.birthdata} />

                        <ChartSection title="KP Cusps" data={kp?.cuspsChart} />
                        <ChartSection title="KP Birth" data={kp?.birthChart} />

                        <KPPlanetTable data={kp?.planets} />
                        <KPCuspsTable data={kp?.cuspsData} />

                        <PlanetSignificators data={kp?.significators} />
                        <KPRulingPlanets data={kp?.ruling} />
                        <HouseSignificators data={kp?.houseSign} />

                    </>
                );

            case "other":
                return (
                    <>
                        <NumerologySection data={numerology} />
                        <PredictionSection data={prediction} />
                        <KarakaPlanetSection data={numerology} />
                    </>
                );
            default:
                return null;
        }
    }, [
        activeTab,
        dataLoading,
        astroData,
        birthData,
        // friendship,
        charts,
        planetData,
        dosha,
        dasha,
        kp,
        numerology,
        prediction,
    ]);

    if (initialLoading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#7F1D1D" />
                <Text style={styles.loadingText}>
                    Loading Kundli basic profile...
                </Text>
            </View>
        );
    }
const formatDate = (basic) => {
  if (!basic) return "...";

  const date = new Date(
    basic.year,
    basic.month - 1, // JS months are 0-based
    basic.day
  );

  const weekday = date.toLocaleString("en-US", { weekday: "short" });
  const month = date.toLocaleString("en-US", { month: "short" });

  return `${weekday} ${month} ${basic.day} ${basic.year}`;
};

    return (
        <View style={styles.fullScreenContainer}>
            {/* Header */}
            <View style={styles.headerCard}>
                <Text style={styles.name}>{basic?.name || "User Kundli"}</Text>
                <Text style={styles.sub}>{basic?.place}</Text>
                <View style={styles.dateRow}>
                    <Icon name="calendar" size={14} color="#555" />
                    <Text style={styles.subDetail}>
                        {formatDate(basic)}
                    </Text>
                    <Icon
                        name="clock-outline"
                        size={14}
                        color="#555"
                        style={{ marginLeft: 15 }}
                    />
                    <Text style={styles.subDetail}>
                        {basic ? `${basic.hour}:${basic.min}` : "..."}
                    </Text>
                    <Icon
                        name="gender-male-female"
                        size={14}
                        color="#555"
                        style={{ marginLeft: 15 }}
                    />
                    <Text style={styles.subDetail}>
                        {basic?.gender || "..."}
                    </Text>
                </View>
            </View>

            {/* Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={tabStyles.tabContainer}
                contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
            >

                {tabs.map((tab) => (
                    <TabButton
                        key={tab.id}
                        tab={tab}
                        activeTab={activeTab}
                        onPress={setActiveTab}
                    />
                ))}
            </ScrollView>

            {/* Content */}
            <ScrollView
                style={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {renderTabContent}
                <View style={{ height: 80 }} />
            </ScrollView>
        </View>
    );
};

export default KundliDetailScreen;

// ===========================================
// 5. STYLES
// ===========================================

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: "#F8F4EF",
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F8F4EF",
    },
    tabLoader: {
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
        backgroundColor: "#FFF",
        borderRadius: 12,
        marginTop: 10,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#7F1D1D",
        fontWeight: "500",
    },
    headerCard: {
        backgroundColor: "#FFF",
        padding: 20,
        paddingBottom: 15,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    name: {
        fontSize: 24,
        fontWeight: "800",
        color: "#2C1810",
        marginBottom: 4,
    },
    sub: {
        color: "#777",
        fontSize: 14,
        marginBottom: 10,
    },
    dateRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    subDetail: {
        marginLeft: 4,
        marginRight: 5,
        color: "#555",
        fontSize: 13,
    },
});

const collapsibleStyles = StyleSheet.create({
    card: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        marginBottom: 10,
        overflow: "hidden",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#FEFCE8",
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "#4A2F1D",
    },
    content: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#F3EFE9",
    },
});

const dataSectionStyles = StyleSheet.create({
    noData: {
        color: "#B91C1C",
        fontStyle: "italic",
    },
    row: {
        flexDirection: "row",
        marginBottom: 6,
        alignItems: "flex-start",
    },
    keyText: {
        fontWeight: "600",
        color: "#2C1810",
        width: 140,
        marginRight: 8,
        fontSize: 13,
    },
    valueText: {
        flex: 1,
        color: "#555",
        fontSize: 13,
    },
    tableRow: {
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#ECE7DD",
        borderRadius: 8,
        padding: 8,
    },
    tableCell: {
        marginBottom: 4,
    },
    cellKey: {
        fontSize: 11,
        fontWeight: "700",
        color: "#7F1D1D",
    },
    cellVal: {
        fontSize: 13,
        color: "#444",
    },
});



const tabStyles = StyleSheet.create({
    tabContainer: {
        flexDirection: "row",
        paddingVertical: 6,        // reduced from 10
        backgroundColor: "#F8F4EF",
        // borderBottomWidth: 1,
        borderBottomColor: "#DDD",
        maxHeight: 50
    },

    tab: {
        paddingHorizontal: 14,     // reduced horizontal padding
        paddingVertical: 6,        // reduced vertical padding
        marginRight: 10,
        borderRadius: 18,          // smaller pill
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EAE6E1",
        maxHeight: 40,             // ↓ lower height (was 40)
    },

    activeTab: {
        backgroundColor: "#7F1D1D",
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
    },

    tabIcon: {
        marginRight: 4,
        fontSize: 16,              // ↓ slightly smaller icon
    },

    tabText: {
        fontSize: 12,              // ↓ smaller text
        fontWeight: "600",
        color: "#4A2F1D",
    },

    activeTabText: {
        color: "#FFF",
    },
});



const planetStyles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        backgroundColor: "#FEF3C7",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },

    row: {
        flexDirection: "row",
        backgroundColor: "#FFF",
    },

    cell: {
        paddingVertical: 10,
        paddingHorizontal: 6,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#E5E5E5",
        justifyContent: "center",
    },

    headerText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#7F1D1D",
        textAlign: "center",
    },
});


const doshaStyles = StyleSheet.create({
    block: {
        paddingVertical: 8,
    },
    status: {
        fontWeight: "700",
        fontSize: 14,
        color: "#B91C1C",
        marginBottom: 6,
    },
    desc: {
        fontSize: 13,
        color: "#444",
        marginBottom: 8,
        lineHeight: 18,
    },
    remTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#2C1810",
        marginBottom: 4,
    },
    remItem: {
        fontSize: 13,
        color: "#444",
        marginBottom: 2,
    },
});

const dashaStyles = StyleSheet.create({
    subRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
        paddingLeft: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3EFE9",
    },
    subPlanet: {
        fontSize: 12,
        fontWeight: "600",
        color: "#4A2F1D",
    },
    subDate: {
        fontSize: 11,
        color: "#555",
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#F1EDE5",
    },
    planetText: {
        flex: 1,
        fontSize: 13,
        fontWeight: "600",
        color: "#7F1D1D",
    },
    dateText: {
        flex: 1,
        fontSize: 12,
        color: "#555",
        textAlign: "right",
    },
});

