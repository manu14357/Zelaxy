import chalk from 'chalk'
import type { Command } from 'commander'
import { info } from '../utils.js'

const SPONSORS_URL = 'https://github.com/sponsors/manu14357'
const GITHUB_API = 'https://api.github.com/graphql'
const GITHUB_LOGIN = 'manu14357'
const GOAL_AMOUNT = 5000

interface SponsorTierDisplay {
  label: string
  color: (text: string) => string
  minAmount: number
}

const TIERS: SponsorTierDisplay[] = [
  { label: 'Diamond', color: chalk.cyanBright, minAmount: 1000 },
  { label: 'Platinum', color: chalk.white, minAmount: 500 },
  { label: 'Gold', color: chalk.yellow, minAmount: 250 },
  { label: 'Silver', color: chalk.gray, minAmount: 100 },
  { label: 'Bronze', color: chalk.hex('#cd7f32'), minAmount: 50 },
  { label: 'Supporter', color: chalk.hex('#f97316'), minAmount: 15 },
  { label: 'Backer', color: chalk.magenta, minAmount: 5 },
]

function getTierLabel(amount: number): { label: string; color: (text: string) => string } {
  for (const tier of TIERS) {
    if (amount >= tier.minAmount) return tier
  }
  return TIERS[TIERS.length - 1]
}

function progressBar(current: number, total: number, width = 30): string {
  const ratio = Math.min(current / total, 1)
  const filled = Math.round(width * ratio)
  const empty = width - filled
  const bar = chalk.magenta('█'.repeat(filled)) + chalk.gray('░'.repeat(empty))
  return `${bar} ${Math.round(ratio * 100)}%`
}

export function registerSponsorCommands(program: Command): void {
  const sponsors = program
    .command('sponsors')
    .description('View Zelaxy sponsors and sponsorship info')

  sponsors
    .command('list')
    .description('List current sponsors')
    .action(async () => {
      console.log(chalk.magenta.bold('\n  ❤  Zelaxy Sponsors\n'))

      try {
        const token = process.env.GITHUB_TOKEN
        if (!token) {
          info('Set GITHUB_TOKEN to fetch live sponsor data.')
          info(`View sponsors at: ${chalk.underline(SPONSORS_URL)}`)
          console.log()
          return
        }

        const query = `
          query {
            user(login: "${GITHUB_LOGIN}") {
              sponsorshipsAsMaintainer(first: 100, activeOnly: true) {
                totalCount
                nodes {
                  sponsorEntity {
                    ... on User { login name }
                    ... on Organization { login name }
                  }
                  tier { monthlyPriceInDollars }
                }
              }
            }
          }
        `

        const res = await fetch(GITHUB_API, {
          method: 'POST',
          headers: {
            Authorization: `bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        })

        if (!res.ok) {
          info('Could not fetch sponsor data from GitHub.')
          info(`View sponsors at: ${chalk.underline(SPONSORS_URL)}`)
          console.log()
          return
        }

        const data = await res.json()
        const nodes = data?.data?.user?.sponsorshipsAsMaintainer?.nodes ?? []

        if (nodes.length === 0) {
          info('No sponsors yet. Be the first!')
          info(`Sponsor at: ${chalk.underline(SPONSORS_URL)}`)
          console.log()
          return
        }

        // Sort by amount descending
        const sorted = [...nodes].sort(
          (a: { tier: { monthlyPriceInDollars: number } }, b: { tier: { monthlyPriceInDollars: number } }) =>
            b.tier.monthlyPriceInDollars - a.tier.monthlyPriceInDollars
        )

        for (const node of sorted) {
          const amount = node.tier.monthlyPriceInDollars
          const name = node.sponsorEntity.name || node.sponsorEntity.login
          const { label, color } = getTierLabel(amount)
          console.log(`  ${color(`[${label}]`)} ${chalk.white(name)} ${chalk.gray(`$${amount}/mo`)}`)
        }

        console.log()
        info(`Total: ${nodes.length} sponsor${nodes.length === 1 ? '' : 's'}`)
      } catch {
        info('Could not fetch sponsor data.')
        info(`View sponsors at: ${chalk.underline(SPONSORS_URL)}`)
      }
      console.log()
    })

  sponsors
    .command('info')
    .description('Show sponsorship tiers and how to sponsor')
    .action(() => {
      console.log(chalk.magenta.bold('\n  ❤  Sponsor Zelaxy\n'))
      console.log(
        chalk.white(
          '  Zelaxy is free and open source. Sponsors help sustain\n  development and keep the project growing.\n'
        )
      )

      console.log(chalk.bold('  Sponsorship Tiers:\n'))
      for (const tier of TIERS) {
        console.log(`  ${tier.color(`${tier.label.padEnd(12)}`)} ${chalk.gray(`$${tier.minAmount}+/mo`)}`)
      }

      console.log()
      console.log(`  ${chalk.bold('Sponsor at:')} ${chalk.underline(SPONSORS_URL)}`)
      console.log()
    })

  sponsors
    .command('goal')
    .description('Show progress toward the monthly sponsorship goal')
    .action(async () => {
      console.log(chalk.magenta.bold('\n  🎯  Sponsorship Goal\n'))

      try {
        const token = process.env.GITHUB_TOKEN
        if (!token) {
          console.log(`  Goal: ${chalk.white(`$${GOAL_AMOUNT}/mo`)} — Full-time open source & more projects`)
          console.log(`  ${progressBar(0, GOAL_AMOUNT)}`)
          console.log()
          info('Set GITHUB_TOKEN to see live progress.')
          info(`Sponsor at: ${chalk.underline(SPONSORS_URL)}`)
          console.log()
          return
        }

        const query = `
          query {
            user(login: "${GITHUB_LOGIN}") {
              sponsorshipsAsMaintainer(first: 100, activeOnly: true) {
                nodes {
                  tier { monthlyPriceInDollars }
                }
              }
            }
          }
        `

        const res = await fetch(GITHUB_API, {
          method: 'POST',
          headers: {
            Authorization: `bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        })

        if (!res.ok) {
          console.log(`  Goal: ${chalk.white(`$${GOAL_AMOUNT}/mo`)} — Full-time open source & more projects`)
          console.log(`  ${progressBar(0, GOAL_AMOUNT)}`)
          console.log()
          info(`View at: ${chalk.underline(SPONSORS_URL)}`)
          console.log()
          return
        }

        const data = await res.json()
        const nodes = data?.data?.user?.sponsorshipsAsMaintainer?.nodes ?? []
        const total = nodes.reduce(
          (sum: number, n: { tier: { monthlyPriceInDollars: number } }) =>
            sum + n.tier.monthlyPriceInDollars,
          0
        )

        console.log(`  Goal: ${chalk.white(`$${GOAL_AMOUNT}/mo`)} — Full-time open source & more projects`)
        console.log(`  Current: ${chalk.green(`$${total}/mo`)} from ${nodes.length} sponsor${nodes.length === 1 ? '' : 's'}`)
        console.log(`  ${progressBar(total, GOAL_AMOUNT)}`)

        if (total < GOAL_AMOUNT) {
          console.log()
          console.log(`  ${chalk.gray(`$${GOAL_AMOUNT - total} more needed to reach the goal`)}`)
        } else {
          console.log()
          console.log(`  ${chalk.green('✓ Goal reached! Thank you to all sponsors!')}`)
        }
      } catch {
        console.log(`  Goal: ${chalk.white(`$${GOAL_AMOUNT}/mo`)} — Full-time open source & more projects`)
        console.log(`  ${progressBar(0, GOAL_AMOUNT)}`)
        info('Could not fetch live data.')
      }
      console.log()
    })
}
