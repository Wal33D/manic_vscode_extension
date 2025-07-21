#!/bin/bash

# Enhanced Claude Quick PR Script - More robust error handling and test verification
# Usage: ./claude-quick-pr-enhanced.sh "Your commit message"

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print colored output
print_error() {
    echo -e "${RED}✗ $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run pre-commit checks with detailed error reporting
run_checks() {
    local failed=false
    
    print_info "Running pre-commit checks..."
    
    # TypeScript check
    echo -n "  TypeScript check... "
    if npm run type-check > /tmp/claude-pr-typecheck.log 2>&1; then
        print_success "passed"
    else
        print_error "failed"
        echo "TypeScript errors:"
        cat /tmp/claude-pr-typecheck.log | grep -E "error TS|\.ts\(" | head -20
        failed=true
    fi
    
    # ESLint check
    echo -n "  ESLint check... "
    if npm run lint > /tmp/claude-pr-lint.log 2>&1; then
        print_success "passed"
    else
        print_error "failed"
        echo "ESLint errors:"
        cat /tmp/claude-pr-lint.log | grep -E "error|warning" | head -20
        
        # Check if only warnings
        if ! grep -q "error" /tmp/claude-pr-lint.log; then
            print_warning "Only warnings found, continuing..."
            failed=false
        else
            failed=true
        fi
    fi
    
    # Prettier format
    echo -n "  Prettier format... "
    if npm run format > /tmp/claude-pr-format.log 2>&1; then
        print_success "formatted"
    else
        print_error "failed"
        cat /tmp/claude-pr-format.log | head -10
        failed=true
    fi
    
    if [ "$failed" = true ]; then
        print_error "Pre-commit checks failed! Please fix the errors above."
        
        # Offer to show full logs
        read -p "Show full error logs? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "=== TypeScript Errors ==="
            cat /tmp/claude-pr-typecheck.log
            echo -e "\n=== ESLint Errors ==="
            cat /tmp/claude-pr-lint.log
        fi
        
        # Clean up temp files
        rm -f /tmp/claude-pr-*.log
        exit 1
    fi
    
    # Clean up temp files
    rm -f /tmp/claude-pr-*.log
    print_success "All pre-commit checks passed!"
}

# Function to wait for CI with better status reporting
wait_for_ci() {
    local pr_num=$1
    local max_wait=900  # 15 minutes
    local elapsed=0
    local interval=20
    local last_status=""
    
    print_info "Waiting for CI tests to complete..."
    
    # Give GitHub time to trigger workflows
    sleep 10
    
    while [ $elapsed -lt $max_wait ]; do
        # Get detailed check status
        local checks_json=$(gh pr checks $pr_num --json name,status,conclusion,detailsUrl 2>/dev/null || echo "{}")
        
        if [ "$checks_json" = "{}" ] || [ -z "$checks_json" ]; then
            print_warning "Unable to fetch CI status, retrying..."
            sleep $interval
            elapsed=$((elapsed + interval))
            continue
        fi
        
        # Count statuses
        local total=$(echo "$checks_json" | jq -r '. | length')
        local completed=$(echo "$checks_json" | jq -r '[.[] | select(.conclusion != null)] | length')
        local passed=$(echo "$checks_json" | jq -r '[.[] | select(.conclusion == "success")] | length')
        local failed=$(echo "$checks_json" | jq -r '[.[] | select(.conclusion == "failure")] | length')
        local running=$(echo "$checks_json" | jq -r '[.[] | select(.status == "in_progress")] | length')
        local queued=$(echo "$checks_json" | jq -r '[.[] | select(.status == "queued")] | length')
        
        # Build status string
        local status_string="Total: $total | ✓ Passed: $passed"
        [ $failed -gt 0 ] && status_string="$status_string | ✗ Failed: $failed"
        [ $running -gt 0 ] && status_string="$status_string | ⟳ Running: $running"
        [ $queued -gt 0 ] && status_string="$status_string | ⏸ Queued: $queued"
        
        # Only print if status changed
        if [ "$status_string" != "$last_status" ]; then
            echo -e "\r\033[K  $status_string"
            last_status="$status_string"
        fi
        
        # Check for failures
        if [ $failed -gt 0 ]; then
            echo  # New line after status
            print_error "CI tests failed!"
            echo "Failed checks:"
            echo "$checks_json" | jq -r '.[] | select(.conclusion == "failure") | "  - " + .name + " (" + .detailsUrl + ")"'
            
            # Get workflow logs if possible
            local workflow_runs=$(gh run list --limit 5 --json status,conclusion,name,url | jq -r '.[] | select(.conclusion == "failure")')
            if [ -n "$workflow_runs" ]; then
                echo -e "\nFailed workflow runs:"
                echo "$workflow_runs" | jq -r '"  - " + .name + " (" + .url + ")"'
            fi
            
            return 1
        fi
        
        # Check if all completed successfully
        if [ $completed -eq $total ] && [ $passed -eq $total ]; then
            echo  # New line after status
            print_success "All $total CI tests passed!"
            return 0
        fi
        
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    
    echo  # New line after status
    print_error "Timeout waiting for CI tests after ${max_wait} seconds"
    return 1
}

# Main script starts here
print_info "Enhanced Claude Quick PR Workflow"
echo "================================="

# Check prerequisites
if ! command_exists gh; then
    print_error "GitHub CLI (gh) is not installed. Please install it first."
    exit 1
fi

if ! command_exists jq; then
    print_error "jq is not installed. Please install it first."
    exit 1
fi

# Check if authenticated with GitHub
if ! gh auth status >/dev/null 2>&1; then
    print_error "Not authenticated with GitHub CLI. Run 'gh auth login' first."
    exit 1
fi

# Get commit message from argument or prompt
COMMIT_MESSAGE="$1"
if [ -z "$COMMIT_MESSAGE" ]; then
    print_info "Enter commit message (or press Ctrl+C to cancel):"
    read -r COMMIT_MESSAGE
    if [ -z "$COMMIT_MESSAGE" ]; then
        print_error "Commit message cannot be empty"
        exit 1
    fi
fi

# Run comprehensive checks
run_checks

# Configure git
print_info "Configuring git credentials..."
git config user.email "aquataze@yahoo.com"
git config user.name "Wal33D"

# Detect default branch
print_info "Detecting default branch..."
git fetch origin --quiet
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
if [ -z "$DEFAULT_BRANCH" ]; then
    DEFAULT_BRANCH=$(git remote show origin | grep 'HEAD branch' | cut -d' ' -f5)
fi
if [ -z "$DEFAULT_BRANCH" ]; then
    DEFAULT_BRANCH="main"
fi
echo "  Default branch: $DEFAULT_BRANCH"

# Stash any uncommitted changes
if [[ -n $(git status -s) ]]; then
    print_warning "Stashing uncommitted changes..."
    git stash push -m "claude-pr-script-stash-$(date +%s)"
fi

# Update default branch
print_info "Updating $DEFAULT_BRANCH branch..."
git checkout $DEFAULT_BRANCH
git pull origin $DEFAULT_BRANCH --ff-only || {
    print_error "Failed to update $DEFAULT_BRANCH branch. Please resolve conflicts manually."
    exit 1
}

# Restore stashed changes
if git stash list | grep -q "claude-pr-script-stash"; then
    print_info "Restoring stashed changes..."
    git stash pop
fi

# Create branch
BRANCH=$(echo "$COMMIT_MESSAGE" | head -n1 | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | cut -c1-50)
if [ -z "$BRANCH" ]; then
    BRANCH="update-$(date +%Y%m%d-%H%M%S)"
fi

print_info "Creating branch: $BRANCH"
git checkout -b $BRANCH

# Check for changes to commit
if [[ -z $(git status -s) ]]; then
    print_error "No changes to commit"
    exit 1
fi

# Commit and push
print_info "Committing changes..."
git add -A
git commit -m "$COMMIT_MESSAGE" || {
    print_error "Failed to commit changes"
    exit 1
}

print_info "Pushing to remote..."
git push -u origin $BRANCH || {
    print_error "Failed to push to remote"
    exit 1
}

# Create PR with better error handling
print_info "Creating pull request..."
PR_OUTPUT=$(gh pr create --fill --base $DEFAULT_BRANCH 2>&1) || {
    print_error "Failed to create PR: $PR_OUTPUT"
    
    # Check if PR already exists
    if echo "$PR_OUTPUT" | grep -q "already exists"; then
        print_warning "PR already exists for this branch"
        PR_URL=$(gh pr view --json url -q .url)
        PR_NUM=$(echo "$PR_URL" | grep -oE '[0-9]+$')
    else
        exit 1
    fi
}

if [ -z "$PR_URL" ]; then
    PR_URL=$(echo "$PR_OUTPUT" | grep -oE 'https://[^\s]+')
    PR_NUM=$(echo "$PR_URL" | grep -oE '[0-9]+$')
fi

print_success "PR created: $PR_URL"

# Wait for CI with enhanced monitoring
if wait_for_ci $PR_NUM; then
    # Ask for confirmation before merging
    print_info "Ready to merge PR #$PR_NUM"
    read -p "Proceed with merge? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Merging pull request..."
        if gh pr merge $PR_NUM --merge --admin; then
            print_success "PR merged successfully!"
            
            # Update local default branch
            print_info "Updating local $DEFAULT_BRANCH branch..."
            git checkout $DEFAULT_BRANCH
            git pull origin $DEFAULT_BRANCH
            
            # Offer to delete feature branch
            read -p "Delete feature branch '$BRANCH'? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git branch -d $BRANCH 2>/dev/null || git branch -D $BRANCH
                print_success "Feature branch deleted"
            fi
            
            print_success "Workflow completed successfully! 🎉"
        else
            print_error "Failed to merge PR"
            exit 1
        fi
    else
        print_warning "Merge cancelled. PR remains open at: $PR_URL"
        print_info "To merge manually, run: gh pr merge $PR_NUM --merge --admin"
    fi
else
    print_error "CI tests failed or timed out"
    print_info "View PR at: $PR_URL"
    print_info "After fixing issues, push changes and the CI will re-run automatically"
    exit 1
fi