import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Payment, Person, Utang } from '~/types'
import { calculateAccruedInterest, getOutstandingBalance, formatCurrency, formatDate, formatDateTime } from './useUtangCalc'

export function usePdfExport() {
  async function exportPersonUtangPdf(person: Person, utangs: Utang[], payments: Payment[]) {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const marginX = 40
    let y = 48

    // Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('Janice Store', marginX, y)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text('Utang History Report', marginX, y + 18)
    doc.setTextColor(0)
    y += 44

    // Customer block
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(person.fullName, marginX, y)
    y += 18
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(90)
    const contactLines: string[] = []
    if (person.phoneNumber) contactLines.push(`Phone: ${person.phoneNumber}`)
    if (person.gcashName || person.gcashNumber) {
      contactLines.push(`GCash: ${[person.gcashName, person.gcashNumber].filter(Boolean).join(' · ')}`)
    }
    if (person.address) contactLines.push(`Address: ${person.address}`)
    for (const line of contactLines) {
      doc.text(line, marginX, y)
      y += 14
    }
    doc.setTextColor(0)
    y += 6
    doc.text(`Generated: ${formatDateTime(Date.now())}`, marginX, y)
    y += 20

    // Summary
    const totalOutstanding = utangs.reduce((sum, u) => sum + getOutstandingBalance(u), 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`Total outstanding: ${formatCurrency(totalOutstanding)}`, marginX, y)
    y += 18

    // Utang table
    const rows = utangs
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((u) => {
        const interest = calculateAccruedInterest(u)
        const desc =
          u.type === 'tinda'
            ? (u.items || []).map((i) => `${i.quantity}x ${i.productName}`).join(', ')
            : u.type === 'gcash'
              ? u.gcashNumber || ''
              : u.note || ''
        return [
          formatDate(u.createdAt),
          u.type,
          desc,
          formatCurrency(u.amount),
          interest > 0 ? formatCurrency(interest) : '-',
          u.dueDate ? formatDate(u.dueDate) : '-',
          u.status,
          formatCurrency(getOutstandingBalance(u))
        ]
      })

    autoTable(doc, {
      startY: y,
      head: [['Date', 'Type', 'Details', 'Amount', 'Interest', 'Due', 'Status', 'Outstanding']],
      body: rows,
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 8, cellPadding: 5 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      columnStyles: { 2: { cellWidth: 130 } }
    })

    // Payment history
    // @ts-expect-error jspdf-autotable augments doc with lastAutoTable at runtime
    let afterTableY = (doc.lastAutoTable?.finalY || y) + 24
    if (payments.length > 0) {
      if (afterTableY > 720) {
        doc.addPage()
        afterTableY = 48
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('Payment History', marginX, afterTableY)
      afterTableY += 8

      const paymentRows = payments
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((p) => [formatDate(p.createdAt), formatCurrency(p.amount), p.note || '-'])

      autoTable(doc, {
        startY: afterTableY + 8,
        head: [['Date', 'Amount', 'Note']],
        body: paymentRows,
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 8, cellPadding: 5 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255 }
      })
    }

    const filename = `${person.fullName.replace(/\s+/g, '-')}-utang-history.pdf`
    doc.save(filename)
  }

  return { exportPersonUtangPdf }
}
