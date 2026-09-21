"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, FileText, BarChart3, TrendingUp, Clock, Filter } from "lucide-react"

const reportsList = [
  { id: "RPT-001", name: "\u5468\u6784\u5EFA\u6C47\u603B\u62A5\u544A", type: "\u6784\u5EFA", period: "2026-W07", generated: "2026-02-12 08:00", status: "\u5DF2\u5B8C\u6210", size: "2.4 MB" },
  { id: "RPT-002", name: "\u8D28\u91CF\u95E8\u7981\u8D8B\u52BF\u5206\u6790", type: "\u8D28\u91CF", period: "2026-02", generated: "2026-02-11 12:00", status: "\u5DF2\u5B8C\u6210", size: "1.8 MB" },
  { id: "RPT-003", name: "\u53D1\u5E03\u90E8\u7F72\u62A5\u544A", type: "\u53D1\u5E03", period: "2026-02", generated: "2026-02-10 18:00", status: "\u5DF2\u5B8C\u6210", size: "3.1 MB" },
  { id: "RPT-004", name: "\u4EE3\u7801\u8986\u76D6\u7387\u5206\u6790", type: "\u8D28\u91CF", period: "2026-W07", generated: "2026-02-12 06:00", status: "\u751F\u6210\u4E2D", size: "-" },
  { id: "RPT-005", name: "\u6D41\u6C34\u7EBF\u6027\u80FD\u62A5\u544A", type: "\u6D41\u6C34\u7EBF", period: "2026-01", generated: "2026-02-09 09:00", status: "\u5DF2\u5B8C\u6210", size: "1.2 MB" },
  { id: "RPT-006", name: "\u6708\u6784\u5EFA\u5931\u8D25\u5206\u6790", type: "\u6784\u5EFA", period: "2026-01", generated: "2026-02-01 00:00", status: "\u5DF2\u5B8C\u6210", size: "4.5 MB" },
]

const typeColorMap: Record<string, string> = {
  "\u6784\u5EFA": "bg-[hsl(199,89%,48%)]/15 text-status-info",
  "\u8D28\u91CF": "bg-[hsl(262,52%,47%)]/15 text-status-purple",
  "\u53D1\u5E03": "bg-[hsl(145,63%,42%)]/15 text-status-success",
  "\u6D41\u6C34\u7EBF": "bg-[hsl(38,92%,50%)]/15 text-status-warning",
}

export function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{"\u62A5\u544A\u4E2D\u5FC3"}</h1>
          <p className="text-sm text-muted-foreground">{"\u67E5\u770B\u548C\u4E0B\u8F7D\u6784\u5EFA\u3001\u8D28\u91CF\u3001\u53D1\u5E03\u62A5\u544A"}</p>
        </div>
        <Button className="bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,42%)] text-white">
          <FileText className="w-4 h-4 mr-2" />
          {"\u751F\u6210\u62A5\u544A"}
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "\u62A5\u544A\u603B\u6570", value: "156", icon: FileText, change: "\u672C\u5468 +12" },
          { label: "\u5E73\u5747\u6784\u5EFA\u65F6\u957F", value: "8m 32s", icon: Clock, change: "\u73AF\u6BD4 -15%" },
          { label: "\u6784\u5EFA\u6210\u529F\u7387", value: "94.2%", icon: TrendingUp, change: "\u73AF\u6BD4 +2.1%" },
          { label: "\u8D28\u91CF\u8BC4\u5206", value: "87/100", icon: BarChart3, change: "\u73AF\u6BD4 +5" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-status-success mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select defaultValue="all">
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder={"\u62A5\u544A\u7C7B\u578B"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{"\u5168\u90E8\u7C7B\u578B"}</SelectItem>
                <SelectItem value="build">{"\u6784\u5EFA"}</SelectItem>
                <SelectItem value="quality">{"\u8D28\u91CF"}</SelectItem>
                <SelectItem value="release">{"\u53D1\u5E03"}</SelectItem>
                <SelectItem value="pipeline">{"\u6D41\u6C34\u7EBF"}</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder={"\u65F6\u95F4\u8303\u56F4"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{"\u5168\u90E8\u65F6\u95F4"}</SelectItem>
                <SelectItem value="week">{"\u672C\u5468"}</SelectItem>
                <SelectItem value="month">{"\u672C\u6708"}</SelectItem>
                <SelectItem value="quarter">{"\u672C\u5B63\u5EA6"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground">{"\u5168\u90E8\u62A5\u544A"}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground">ID</TableHead>
                <TableHead className="text-xs text-muted-foreground">{"\u62A5\u544A\u540D\u79F0"}</TableHead>
                <TableHead className="text-xs text-muted-foreground">{"\u7C7B\u578B"}</TableHead>
                <TableHead className="text-xs text-muted-foreground">{"\u5468\u671F"}</TableHead>
                <TableHead className="text-xs text-muted-foreground">{"\u751F\u6210\u65F6\u95F4"}</TableHead>
                <TableHead className="text-xs text-muted-foreground">{"\u72B6\u6001"}</TableHead>
                <TableHead className="text-xs text-muted-foreground">{"\u5927\u5C0F"}</TableHead>
                <TableHead className="text-xs text-muted-foreground text-right">{"\u64CD\u4F5C"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportsList.map((report) => (
                <TableRow key={report.id} className="border-border">
                  <TableCell className="text-xs font-mono text-muted-foreground">{report.id}</TableCell>
                  <TableCell className="text-sm text-foreground">{report.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={typeColorMap[report.type]}>
                      {report.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{report.period}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{report.generated}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        report.status === "\u5DF2\u5B8C\u6210"
                          ? "bg-[hsl(145,63%,42%)]/15 text-status-success"
                          : "bg-[hsl(38,92%,50%)]/15 text-status-warning"
                      }
                    >
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{report.size}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={report.status !== "\u5DF2\u5B8C\u6210"}
                      className="h-7 text-xs text-status-info"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      {"\u4E0B\u8F7D"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
