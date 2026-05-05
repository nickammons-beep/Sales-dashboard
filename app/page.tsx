
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trophy, TrendingUp, Users, Clock, Plus, Award, Target, Zap, Crown, RotateCcw, Download } from 'lucide-react'
import { Toaster, toast } from 'sonner'

interface Win {
  id: string
  team: string
  type: string
  points: number
  account: string
  opportunity: string
  gongLink: string
  notes: string
  timestamp: string
  submittedBy: string
}

interface Team {
  name: string
  captain: string
  color: string
  points: number
}

interface CompetitionData {
  teams: Team[]
  wins: Win[]
  lastUpdated: string
}

const STORAGE_KEY = 'sales-competition-data'

export default function CompetitionTrackerDashboard() {
  useEffect(() => {
    document.title = 'Gartner ToolSmith - Competition Tracker Dashboard'
  }, [])

  const endDate = new Date()
  endDate.setDate(endDate.getDate() + ((5 - endDate.getDay() + 7) % 7))
  endDate.setHours(16, 0, 0, 0)

  const initialTeams: Team[] = [
    { name: 'Team Grant', captain: 'Grant', color: 'bg-blue-600', points: 0 },
    { name: 'Team Ardavan', captain: 'Ardavan', color: 'bg-purple-600', points: 0 },
  ]

  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [wins, setWins] = useState<Win[]>([])
  const [timeRemaining, setTimeRemaining] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const [formData, setFormData] = useState({
    team: '',
    type: '',
    account: '',
    opportunity: '',
    gongLink: '',
    notes: '',
    submittedBy: '',
  })

  const winTypes = [
    { value: 'stage-conversion', label: 'Stage Conversion (D→C, C→B, B→A)', points: 5 },
    { value: 'new-d-stage', label: 'New D Stage', points: 2 },
    { value: 'referral', label: 'Referral with Introduction', points: 1 },
    { value: 'product-upgrade', label: 'Product Upgrade Opportunity', points: 1 },
  ]

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsed: CompetitionData = JSON.parse(savedData)
        setTeams(parsed.teams)
        setWins(parsed.wins)
        toast.success('Competition data loaded successfully')
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load saved data')
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save data to localStorage whenever teams or wins change
  useEffect(() => {
    if (!isLoaded) return

    try {
      const dataToSave: CompetitionData = {
        teams,
        wins,
        lastUpdated: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.error('Error saving data:', error)
      toast.error('Failed to save data')
    }
  }, [teams, wins, isLoaded])

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const diff = endDate.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('Competition Ended')
        clearInterval(timer)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.team || !formData.type || !formData.account || !formData.submittedBy) {
      toast.error('Please fill in all required fields')
      return
    }

    const selectedType = winTypes.find(t => t.value === formData.type)
    if (!selectedType) return

    const newWin: Win = {
      id: Date.now().toString(),
      team: formData.team,
      type: selectedType.label,
      points: selectedType.points,
      account: formData.account,
      opportunity: formData.opportunity,
      gongLink: formData.gongLink,
      notes: formData.notes,
      timestamp: new Date().toISOString(),
      submittedBy: formData.submittedBy,
    }

    setWins([newWin, ...wins])

    setTeams(teams.map(team => 
      team.name === formData.team 
        ? { ...team, points: team.points + selectedType.points }
        : team
    ))

    toast.success(`Win logged! ${selectedType.points} points added to ${formData.team}`)

    setFormData({
      team: '',
      type: '',
      account: '',
      opportunity: '',
      gongLink: '',
      notes: '',
      submittedBy: '',
    })
    setShowForm(false)
  }

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all competition data? This cannot be undone.')) {
      setTeams(initialTeams)
      setWins([])
      localStorage.removeItem(STORAGE_KEY)
      toast.success('Competition data reset successfully')
    }
  }

  const handleExport = () => {
    try {
      const dataToExport = {
        teams,
        wins,
        exportedAt: new Date().toISOString(),
      }
      const dataStr = JSON.stringify(dataToExport, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `competition-data-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Data exported successfully')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    }
  }

  const sortedTeams = [...teams].sort((a, b) => b.points - a.points)
  const pointDifference = Math.abs(sortedTeams[0].points - sortedTeams[1].points)

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading competition data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Competition Tracker Dashboard</h1>
              <p className="text-slate-600">Team Grant vs Team Ardavan - Battle for supremacy</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleExport}
                variant="outline"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Export
              </Button>
              <Button 
                onClick={handleReset}
                variant="outline"
                size="lg"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
              <Button 
                onClick={() => setShowForm(!showForm)}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-5 w-5" />
                Log Win
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Time Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{timeRemaining}</div>
              <p className="text-xs text-slate-500 mt-1">Ends Friday at 4:00 PM</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Competing Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">2</div>
              <p className="text-xs text-slate-500 mt-1">Grant vs Ardavan</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                <Zap className="mr-2 h-4 w-4" />
                Total Wins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{wins.length}</div>
              <p className="text-xs text-slate-500 mt-1">Logged this week</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                <Trophy className="mr-2 h-4 w-4" />
                Point Gap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{pointDifference}</div>
              <p className="text-xs text-slate-500 mt-1">
                {pointDifference === 0 ? 'Tied game!' : 'Points ahead'}
              </p>
            </CardContent>
          </Card>
        </div>

        {showForm && (
          <Card className="mb-8 border-2 border-blue-300 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Log New Win
              </CardTitle>
              <CardDescription>Record a team achievement and update the leaderboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="team">Team *</Label>
                    <Select value={formData.team} onValueChange={(value) => setFormData({...formData, team: value})}>
                      <SelectTrigger id="team">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team.name} value={team.name}>
                            {team.name} - Captain {team.captain}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Win Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select win type" />
                      </SelectTrigger>
                      <SelectContent>
                        {winTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label} ({type.points} pts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account">Account Name *</Label>
                    <Input
                      id="account"
                      value={formData.account}
                      onChange={(e) => setFormData({...formData, account: e.target.value})}
                      placeholder="Enter account name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opportunity">Opportunity</Label>
                    <Input
                      id="opportunity"
                      value={formData.opportunity}
                      onChange={(e) => setFormData({...formData, opportunity: e.target.value})}
                      placeholder="Enter opportunity details"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gongLink">Gong Link</Label>
                    <Input
                      id="gongLink"
                      value={formData.gongLink}
                      onChange={(e) => setFormData({...formData, gongLink: e.target.value})}
                      placeholder="https://..."
                      type="url"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="submittedBy">Submitted By *</Label>
                    <Input
                      id="submittedBy"
                      value={formData.submittedBy}
                      onChange={(e) => setFormData({...formData, submittedBy: e.target.value})}
                      placeholder="Your name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Any additional context or details..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Submit Win
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 border-slate-300">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                  Head-to-Head Leaderboard
                </CardTitle>
                <CardDescription>Current standings - Grant vs Ardavan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedTeams.map((team, index) => (
                    <div 
                      key={team.name} 
                      className={`flex items-center gap-4 p-6 rounded-lg transition-all ${
                        index === 0 
                          ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 shadow-md' 
                          : 'bg-slate-50 border-2 border-slate-200'
                      }`}
                    >
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : 'bg-slate-400'
                      }`}>
                        {index === 0 ? <Crown className="h-6 w-6" /> : index + 1}
                      </div>
                      <div className={`w-3 h-16 rounded ${team.color}`} />
                      <div className="flex-1">
                        <div className="font-bold text-xl text-slate-900">{team.name}</div>
                        <div className="text-sm text-slate-600">Captain: {team.captain}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold text-slate-900">{team.points}</div>
                        <div className="text-sm text-slate-500">points</div>
                      </div>
                      {index === 0 && team.points > 0 && (
                        <Award className="h-8 w-8 text-yellow-500" />
                      )}
                    </div>
                  ))}
                </div>

                {sortedTeams[0].points === sortedTeams[1].points && wins.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <p className="text-blue-800 font-semibold">🔥 It&apos;s a tie! Both teams are neck and neck!</p>
                  </div>
                )}

                {sortedTeams[0].points > sortedTeams[1].points && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-green-800 font-semibold">
                      🎯 {sortedTeams[0].name} leads by {pointDifference} point{pointDifference !== 1 ? 's' : ''}!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest wins and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                {wins.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No wins logged yet</p>
                    <p className="text-sm mt-1">Be the first to score points for your team!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wins.slice(0, 10).map((win) => {
                      const winDate = new Date(win.timestamp)
                      return (
                        <div key={win.id} className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={`${
                                win.team === 'Team Grant' 
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' 
                                  : 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                              }`}>
                                {win.team}
                              </Badge>
                              <Badge variant="outline" className="font-semibold">
                                +{win.points} pts
                              </Badge>
                            </div>
                            <span className="text-xs text-slate-500">
                              {winDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-slate-900 mb-1">{win.type}</div>
                          <div className="text-sm text-slate-600">
                            <span className="font-medium">Account:</span> {win.account}
                            {win.opportunity && (
                              <>
                                {' • '}
                                <span className="font-medium">Opp:</span> {win.opportunity}
                              </>
                            )}
                          </div>
                          {win.gongLink && (
                            <a 
                              href={win.gongLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                            >
                              View Gong Recording →
                            </a>
                          )}
                          {win.notes && (
                            <p className="text-xs text-slate-500 mt-2 italic">{win.notes}</p>
                          )}
                          <div className="text-xs text-slate-400 mt-2">
                            Submitted by {win.submittedBy}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Points Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-green-900">Stage Conversion</span>
                    <Badge className="bg-green-600">5 pts</Badge>
                  </div>
                  <p className="text-xs text-green-700">D→C, C→B, or B→A with MUAP/FEC</p>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-blue-900">New D Stage</span>
                    <Badge className="bg-blue-600">2 pts</Badge>
                  </div>
                  <p className="text-xs text-blue-700">New pipeline opportunity</p>
                </div>

                <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-purple-900">Referral</span>
                    <Badge className="bg-purple-600">1 pt</Badge>
                  </div>
                  <p className="text-xs text-purple-700">With introduction or recommendation</p>
                </div>

                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-orange-900">Product Upgrade</span>
                    <Badge className="bg-orange-600">1 pt</Badge>
                  </div>
                  <p className="text-xs text-orange-700">Team Plus, TMR→TMA, CIO→Exec, etc.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What Counts?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Valid Wins</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Whitespace verbal agreements or BCI acceptance</li>
                    <li>Recurring calls with referrals or new opps</li>
                    <li>Stage conversions with MUAP</li>
                    <li>Product evaluation upgrades</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Requirements</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>All wins must be Gong&apos;d for auditing</li>
                    <li>Or pre-approved by SM if not on Gong</li>
                    <li>Update SM with each win and materials</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Tracking</h4>
                  <p className="text-xs">Teams can share points openly or keep them secret. SM must be updated with account, opp, gong link, and accepted BCI details.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-yellow-900">
                  <Trophy className="mr-2 h-5 w-5" />
                  Losing Team Stakes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                <p className="text-xs">The group will vote on whether winners decide the losing team&apos;s fate. Each team can submit their idea before the blitz ends.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-blue-900">
                  <Users className="mr-2 h-5 w-5" />
                  Team Captains
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-100 border border-blue-300">
                  <div className="font-semibold text-blue-900">Team Grant</div>
                  <p className="text-xs text-blue-700 mt-1">Captain: Grant</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100 border border-purple-300">
                  <div className="font-semibold text-purple-900">Team Ardavan</div>
                  <p className="text-xs text-purple-700 mt-1">Captain: Ardavan</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
