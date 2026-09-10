const fs = require('fs');

let c = fs.readFileSync('src/pages/PaymentsPage.tsx', 'utf8');

const searchTopBtn = `{selected.size > 0 && (
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete ({selected.size})
          </Button>
        )}`;
c = c.replace(searchTopBtn, '');

const searchHeader = `<h3 className="text-lg font-semibold">Payment History</h3>`;
const replaceHeader = `<div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Payment History</h3>
          {selected.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete ({selected.size})
            </Button>
          )}
        </div>`;

if (c.includes(searchHeader)) {
  c = c.replace(searchHeader, replaceHeader);
  fs.writeFileSync('src/pages/PaymentsPage.tsx', c);
  console.log('Moved delete button successfully');
} else {
  console.log('Could not find header');
}
