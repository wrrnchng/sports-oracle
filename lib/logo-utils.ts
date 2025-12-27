// Utility function to safely extract team logo from various ESPN API structures
export function getTeamLogo(team: any): string {
    if (!team) return ''

    // If logo property exists, use it
    if (team.logo) return team.logo

    // Otherwise try to extract from logos array
    if (team.logos && team.logos.length > 0) {
        return team.logos[0].href || ''
    }

    return ''
}
