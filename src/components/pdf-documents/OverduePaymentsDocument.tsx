
"use client";

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import type { Resident, Room } from "@/lib/types";

// If you need custom fonts, register them here. Example:
// Font.register({ 
//   family: 'Open Sans', 
//   fonts: [
//     { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
//     { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 600 }
//   ]
// });
// Then use `fontFamily: 'Open Sans'` in styles. For now, we'll use default Helvetica.

interface OverdueResidentForPdf extends Resident {
  roomDetails?: Room;
  overdueAmount: number;
  lastPaymentMonth?: string;
}

interface OverduePaymentsDocumentProps {
  data: OverdueResidentForPdf[];
  totalOverdueAmount: number;
  reportDate: string; 
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', // Default PDF font
    fontSize: 10,
    paddingTop: 35,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 60, // Increased for footer
    lineHeight: 1.4,
    backgroundColor: '#ffffff',
  },
  header: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 15,
    color: '#1a237e', // Dark blue, primary-like
    fontFamily: 'Helvetica-Bold',
  },
  reportDateText: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555555',
  },
  totalSection: {
    marginBottom: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e8eaf6', // Light primary background
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#c5cae9', // Darker primary shade for border
  },
  totalText: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#c62828', // Destructive-like color for overdue
  },
  table: {
    // @ts-ignore
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: '#ffffff', // White background for rows
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: '#f1f5f9', // Muted background for header
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  tableColHeader: {
    // @ts-ignore
    width: "25%", 
    borderStyle: "solid",
    borderColor: '#cccccc',
    borderRightWidth: 1,
    padding: 6,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'left',
    color: '#334155', // Darker text for header
  },
  tableCol: {
    // @ts-ignore
    width: "25%",
    borderStyle: "solid",
    borderColor: '#cccccc',
    borderRightWidth: 1,
    padding: 6,
    textAlign: 'left',
    color: '#475569', // Standard text color
  },
  currencyText: {
    color: '#c62828', // Destructive-like
    fontFamily: 'Helvetica-Bold',
  },
  noDataText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
    color: '#777777',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#aaaaaa',
    fontSize: 8,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 25, // Aligned with footer
    left: 0,
    right: 40,
    textAlign: 'right',
    color: '#aaaaaa',
  },
});

const OverduePaymentsDocument: React.FC<OverduePaymentsDocumentProps> = ({ data, totalOverdueAmount, reportDate }) => (
  <Document title={`Overdue Payments Report - ${reportDate}`} author="PG Admin">
    <Page size="A4" style={styles.page} orientation="portrait">
      <Text style={styles.header}>Overdue Payments Report</Text>
      <Text style={styles.reportDateText}>{reportDate}</Text>

      <View style={styles.totalSection}>
        <Text style={styles.totalText}>
          Total Overdue Amount: ₹{totalOverdueAmount.toLocaleString()}
        </Text>
      </View>

      {data.length > 0 ? (
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <View style={styles.tableColHeader}><Text>Resident</Text></View>
            <View style={styles.tableColHeader}><Text>Room No.</Text></View>
            <View style={styles.tableColHeader}><Text>Overdue Amt.</Text></View>
            <View style={styles.tableColHeader}><Text>Last Fully Paid</Text></View>
          </View>
          {/* Table Body */}
          {data.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <View style={styles.tableCol}><Text>{item.name}</Text></View>
              <View style={styles.tableCol}><Text>{item.roomDetails?.roomNumber || 'N/A'}</Text></View>
              <View style={styles.tableCol}><Text style={styles.currencyText}>₹{item.overdueAmount.toLocaleString()}</Text></View>
              <View style={styles.tableCol}><Text>{item.lastPaymentMonth}</Text></View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noDataText}>No overdue payments to report for this period.</Text>
      )}

      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `${pageNumber} / ${totalPages}`
      )} fixed />
      <Text style={styles.footer} fixed>
        Generated on: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} by PG Admin System.
      </Text>
    </Page>
  </Document>
);

export default OverduePaymentsDocument;

