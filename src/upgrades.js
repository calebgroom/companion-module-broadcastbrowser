// Upgrade scripts: how buttons made with an older version of this module change for a newer one.
// Once one is added, it can never be removed or reordered (Companion runs each once, in order).

const FEED_ACTIONS = ['output', 'output_mode']
const FEED_FEEDBACKS = ['output', 'ndi_tally']

/** 0.2.0: outputs per feed (program, preview). Buttons from before control and show the program's, as they did. */
function outputsPerFeed(_context, props) {
	const program = { isExpression: false, value: 'program' }
	const updatedActions = props.actions.filter((a) => FEED_ACTIONS.includes(a.actionId) && a.options.feed === undefined)
	for (const a of updatedActions) a.options.feed = program
	const updatedFeedbacks = props.feedbacks.filter(
		(f) => FEED_FEEDBACKS.includes(f.feedbackId) && f.options.feed === undefined,
	)
	for (const f of updatedFeedbacks) f.options.feed = program
	return { updatedConfig: null, updatedActions, updatedFeedbacks }
}

export const UpgradeScripts = [outputsPerFeed]
