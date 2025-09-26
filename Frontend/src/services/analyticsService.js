// Frontend/src/services/analyticsService.js
import { ethers } from 'ethers'

class AnalyticsService {
  constructor() {
    this.contractAddress = "0xd20d0A374d034BCA79046bB8bC2cFBB4c307d61c"
    this.contractABI = [
      "function totalSupply() external view returns (uint256)",
      "function balanceOf(address owner) external view returns (uint256)",
      "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
      "function ownerOf(uint256 tokenId) external view returns (address)",
      "function certificates(uint256 tokenId) external view returns (string studentName, string degreeName, uint256 issueDate, string ipfsHash, address issuer)"
    ]
    
    // Cache to avoid repeated blockchain calls
    this.cache = {
      totalSupply: null,
      lastUpdate: null,
      certificates: new Map()
    }
  }

  /**
   * Get comprehensive analytics data
   */
  async getAnalytics(provider, institutionAddress = null) {
    try {
      console.log('📊 Loading analytics data...')
      
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, provider)
      
      // Get total certificates
      const totalSupply = await contract.totalSupply()
      const totalCertificates = Number(totalSupply)
      
      console.log('📈 Total certificates:', totalCertificates)
      
      // Get certificates data
      const certificatesData = []
      const monthlyData = new Map()
      const departmentData = new Map()
      const dailyVerifications = new Map()
      
      for (let i = 1; i <= totalCertificates; i++) {
        try {
          const certDetails = await contract.certificates(i)
          const owner = await contract.ownerOf(i)
          
          const issueDate = new Date(Number(certDetails.issueDate) * 1000)
          const monthKey = `${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, '0')}`
          const dayKey = issueDate.toISOString().split('T')[0]
          
          const certData = {
            id: i,
            studentName: certDetails.studentName,
            degreeName: certDetails.degreeName,
            issueDate: issueDate,
            ipfsHash: certDetails.ipfsHash,
            issuer: certDetails.issuer,
            owner: owner,
            department: this.extractDepartment(certDetails.degreeName),
            monthKey: monthKey,
            dayKey: dayKey
          }
          
          certificatesData.push(certData)
          
          // Monthly statistics
          monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + 1)
          
          // Department statistics
          const dept = certData.department
          departmentData.set(dept, (departmentData.get(dept) || 0) + 1)
          
          // Daily verifications (simulated)
          dailyVerifications.set(dayKey, Math.floor(Math.random() * 50) + 10)
          
        } catch (certError) {
          console.log(`Certificate ${i} data unavailable:`, certError.message)
        }
      }
      
      // Calculate metrics
      const now = new Date()
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const lastMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`
      
      const thisMonthCount = monthlyData.get(thisMonth) || 0
      const lastMonthCount = monthlyData.get(lastMonth) || 0
      const growthRate = lastMonthCount > 0 ? 
        ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100 : 0
      
      // Get recent certificates (last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const recentCertificates = certificatesData
        .filter(cert => cert.issueDate >= thirtyDaysAgo)
        .sort((a, b) => b.issueDate - a.issueDate)
      
      const analytics = {
        overview: {
          totalCertificates: totalCertificates,
          thisMonthIssued: thisMonthCount,
          growthRate: Math.round(growthRate * 100) / 100,
          averageDaily: Math.round(thisMonthCount / new Date().getDate()),
          totalVerifications: Array.from(dailyVerifications.values())
            .reduce((sum, count) => sum + count, 0)
        },
        
        monthlyTrends: Array.from(monthlyData.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-12)
          .map(([month, count]) => ({
            month: month,
            issued: count,
            monthName: new Date(month + '-01').toLocaleString('default', { 
              month: 'long', 
              year: 'numeric' 
            })
          })),
        
        departmentBreakdown: Array.from(departmentData.entries())
          .map(([department, count]) => ({
            department: department,
            count: count,
            percentage: Math.round((count / totalCertificates) * 100)
          }))
          .sort((a, b) => b.count - a.count),
        
        recentActivity: recentCertificates.slice(0, 10),
        
        dailyVerifications: Array.from(dailyVerifications.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-30)
          .map(([date, count]) => ({
            date: date,
            verifications: count,
            dateFormatted: new Date(date).toLocaleDateString()
          })),
        
        topDegrees: this.getTopDegrees(certificatesData),
        
        issuancePatterns: this.analyzeIssuancePatterns(certificatesData),
        
        lastUpdated: new Date().toISOString()
      }
      
      // Cache the results
      this.cache = {
        totalSupply: totalCertificates,
        lastUpdate: new Date(),
        certificates: certificatesData
      }
      
      return {
        success: true,
        analytics: analytics,
        certificatesData: certificatesData
      }
      
    } catch (error) {
      console.error('❌ Analytics loading failed:', error)
      return {
        success: false,
        error: error.message,
        analytics: null
      }
    }
  }

  /**
   * Extract department from degree name
   */
  extractDepartment(degreeName) {
    const degree = degreeName.toLowerCase()
    
    if (degree.includes('computer') || degree.includes('software') || degree.includes('tech')) {
      return 'Computer Science'
    } else if (degree.includes('business') || degree.includes('management') || degree.includes('mba')) {
      return 'Business'
    } else if (degree.includes('engineering') || degree.includes('mechanical') || degree.includes('electrical')) {
      return 'Engineering'
    } else if (degree.includes('data') || degree.includes('analytics') || degree.includes('science')) {
      return 'Data Science'
    } else if (degree.includes('medical') || degree.includes('health') || degree.includes('nursing')) {
      return 'Healthcare'
    } else if (degree.includes('education') || degree.includes('teaching')) {
      return 'Education'
    } else {
      return 'Other'
    }
  }

  /**
   * Get top degree programs
   */
  getTopDegrees(certificatesData) {
    const degreeCount = new Map()
    
    certificatesData.forEach(cert => {
      const degree = cert.degreeName
      degreeCount.set(degree, (degreeCount.get(degree) || 0) + 1)
    })
    
    return Array.from(degreeCount.entries())
      .map(([degree, count]) => ({ degree, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  /**
   * Analyze issuance patterns
   */
  analyzeIssuancePatterns(certificatesData) {
    const patterns = {
      peakHours: new Array(24).fill(0),
      peakDays: new Array(7).fill(0),
      peakMonths: new Array(12).fill(0)
    }
    
    certificatesData.forEach(cert => {
      const date = cert.issueDate
      patterns.peakHours[date.getHours()]++
      patterns.peakDays[date.getDay()]++
      patterns.peakMonths[date.getMonth()]++
    })
    
    return {
      busiestHour: patterns.peakHours.indexOf(Math.max(...patterns.peakHours)),
      busiestDay: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        [patterns.peakDays.indexOf(Math.max(...patterns.peakDays))],
      busiestMonth: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        [patterns.peakMonths.indexOf(Math.max(...patterns.peakMonths))],
      hourlyDistribution: patterns.peakHours,
      dailyDistribution: patterns.peakDays,
      monthlyDistribution: patterns.peakMonths
    }
  }

  /**
   * Get real-time statistics
   */
  async getRealTimeStats(provider) {
    try {
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, provider)
      
      const totalSupply = await contract.totalSupply()
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      
      return {
        success: true,
        stats: {
          totalCertificates: Number(totalSupply),
          lastUpdated: now.toISOString(),
          networkStatus: 'active',
          contractAddress: this.contractAddress
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate analytics report
   */
  generateAnalyticsReport(analyticsData) {
    const { analytics } = analyticsData
    
    return {
      reportId: `analytics-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      summary: {
        totalCertificates: analytics.overview.totalCertificates,
        monthlyGrowth: analytics.overview.growthRate,
        topDepartment: analytics.departmentBreakdown[0]?.department || 'N/A',
        topDegree: analytics.topDegrees[0]?.degree || 'N/A'
      },
      recommendations: this.generateRecommendations(analytics),
      exportData: {
        monthlyTrends: analytics.monthlyTrends,
        departmentBreakdown: analytics.departmentBreakdown,
        dailyVerifications: analytics.dailyVerifications
      }
    }
  }

  /**
   * Generate recommendations based on analytics
   */
  generateRecommendations(analytics) {
    const recommendations = []
    
    if (analytics.overview.growthRate > 50) {
      recommendations.push({
        type: 'success',
        title: 'High Growth Rate',
        message: 'Certificate issuance is growing rapidly. Consider scaling infrastructure.',
        priority: 'medium'
      })
    }
    
    if (analytics.overview.totalCertificates < 10) {
      recommendations.push({
        type: 'info',
        title: 'Getting Started',
        message: 'Issue more certificates to build a comprehensive portfolio.',
        priority: 'low'
      })
    }
    
    const topDept = analytics.departmentBreakdown[0]
    if (topDept && topDept.percentage > 70) {
      recommendations.push({
        type: 'warning',
        title: 'Department Concentration',
        message: `${topDept.percentage}% of certificates are from ${topDept.department}. Consider diversifying programs.`,
        priority: 'medium'
      })
    }
    
    return recommendations
  }
}

export default new AnalyticsService()
